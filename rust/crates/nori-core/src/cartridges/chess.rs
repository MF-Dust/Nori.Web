use crate::cartridge::{CommandRejected, ReducerResult};
use crate::jsonutil::{now_ms, Json};
use rand::seq::IndexedRandom;
use serde_json::{json, Value};
use shakmaty::fen::Fen;
use shakmaty::san::SanPlus;
use shakmaty::uci::UciMove;
use shakmaty::zobrist::Zobrist64;
use shakmaty::{
    CastlingMode, Chess, Color, EnPassantMode, FromSetup, Move, Position, PositionErrorKinds, Role,
    Square,
};
use std::num::NonZeroU32;

const TUTORIAL: &str = include_str!("../../data/chess_tutorial.json");
const DEBUG: &str = include_str!("../../data/chess_debug.json");

fn tutorial_steps() -> Json {
    serde_json::from_str(TUTORIAL).unwrap_or(json!([]))
}

fn debug_scenarios() -> Json {
    serde_json::from_str(DEBUG).unwrap_or(json!({}))
}

pub fn initial_state() -> Json {
    json!({
        "settings": {"playerSide": "white", "difficulty": "casual", "locale": "en"},
        "gameState": Value::Null,
        "drawOffer": Value::Null,
        "takebackRequest": Value::Null,
        "tutorial": Value::Null,
        "debugScenarioId": Value::Null,
        "debugScenario": Value::Null,
    })
}

fn role_name(role: Role) -> &'static str {
    match role {
        Role::Pawn => "p",
        Role::Knight => "n",
        Role::Bishop => "b",
        Role::Rook => "r",
        Role::Queen => "q",
        Role::King => "k",
    }
}

fn parse_role(name: &str) -> Option<Role> {
    Some(match name {
        "q" => Role::Queen,
        "r" => Role::Rook,
        "b" => Role::Bishop,
        "n" => Role::Knight,
        _ => return None,
    })
}

fn board_from_fen(fen: &str) -> Result<Chess, CommandRejected> {
    let parsed: Fen = fen
        .parse()
        .map_err(|err| CommandRejected::new(format!("Invalid stored chess position: {err}")))?;
    let setup = parsed.into_setup();
    match Chess::from_setup(setup.clone(), CastlingMode::Standard) {
        Ok(pos) => Ok(pos),
        Err(error) => {
            let message = error.to_string();
            if !error.kinds().contains(PositionErrorKinds::OPPOSITE_CHECK) {
                return Err(CommandRejected::new(format!(
                    "Invalid stored chess position: {message}"
                )));
            }
            // python-chess accepts analysis FENs where the side not to move is in check.
            let mut adjusted = setup.clone();
            adjusted.turn = !adjusted.turn;
            if adjusted.halfmoves > 0 {
                adjusted.halfmoves -= 1;
            }
            if adjusted.turn == Color::Black && adjusted.fullmoves.get() > 1 {
                adjusted.fullmoves = NonZeroU32::new(adjusted.fullmoves.get() - 1).unwrap();
            }
            let mut pos = Chess::from_setup(adjusted, CastlingMode::Standard).map_err(|_| {
                CommandRejected::new(format!("Invalid stored chess position: {message}"))
            })?;
            let mover = pos.turn();
            let safe_piece = Square::ALL.into_iter().find_map(|square| {
                pos.board()
                    .piece_at(square)
                    .filter(|piece| {
                        piece.color == mover
                            && (setup.halfmoves == 0 || piece.role != Role::Pawn)
                            && (piece.role != Role::King
                                && (piece.role != Role::Rook
                                    || !setup.castling_rights.contains(square)))
                    })
                    .map(|piece| (square, piece))
            });
            let (square, piece) = safe_piece
                .or_else(|| {
                    let king_has_rights = Square::ALL.into_iter().any(|square| {
                        setup.castling_rights.contains(square)
                            && pos.board().piece_at(square).is_some_and(|piece| {
                                piece.color == mover && piece.role == Role::Rook
                            })
                    });
                    (!king_has_rights)
                        .then(|| {
                            pos.board().king_of(mover).map(|square| {
                                (
                                    square,
                                    shakmaty::Piece {
                                        color: mover,
                                        role: Role::King,
                                    },
                                )
                            })
                        })
                        .flatten()
                })
                .ok_or_else(|| {
                    CommandRejected::new(format!("Invalid stored chess position: {message}"))
                })?;
            pos.play_unchecked(Move::Normal {
                role: piece.role,
                from: square,
                capture: (setup.halfmoves == 0).then_some(Role::Pawn),
                to: square,
                promotion: None,
            });
            Ok(pos)
        }
    }
}

fn side_for_actor(state: &Json, actor: &str) -> Result<String, CommandRejected> {
    let player_side = state
        .pointer("/settings/playerSide")
        .and_then(Value::as_str)
        .unwrap_or("white");
    match actor {
        "player" => Ok(player_side.to_string()),
        "agent" => Ok(if player_side == "white" {
            "black"
        } else {
            "white"
        }
        .into()),
        _ => Err(CommandRejected::new("Unknown actor")),
    }
}

fn phase(pos: &Chess, move_count: usize) -> &'static str {
    let mut non_pawn_non_king = 0;
    let mut material = 0;
    let mut pieces = 0;
    for sq in Square::ALL {
        if let Some(piece) = pos.board().piece_at(sq) {
            pieces += 1;
            if piece.role != Role::Pawn && piece.role != Role::King {
                non_pawn_non_king += 1;
            }
            material += match piece.role {
                Role::Knight | Role::Bishop => 3,
                Role::Rook => 5,
                Role::Queen => 9,
                _ => 0,
            };
        }
    }
    if material <= 20 || non_pawn_non_king <= 6 || pieces <= 12 {
        "endgame"
    } else if move_count <= 20 {
        "opening"
    } else {
        "middlegame"
    }
}

fn position_hash(pos: &Chess) -> Zobrist64 {
    pos.zobrist_hash::<Zobrist64>(EnPassantMode::Legal)
}

fn is_seventyfive_moves(pos: &Chess) -> bool {
    pos.halfmoves() >= 150 && !pos.legal_moves().is_empty()
}

fn is_fivefold_repetition(pos: &Chess, position_history: &[Zobrist64]) -> bool {
    let current = position_hash(pos);
    position_history
        .iter()
        .filter(|&&hash| hash == current)
        .count()
        >= 5
}

fn can_claim_threefold(pos: &Chess, position_history: &[Zobrist64]) -> bool {
    let current = position_hash(pos);
    if position_history
        .iter()
        .filter(|&&hash| hash == current)
        .count()
        >= 3
    {
        return true;
    }
    pos.legal_moves().into_iter().any(|mv| {
        pos.clone().play(mv).is_ok_and(|next| {
            position_history
                .iter()
                .filter(|&&hash| hash == position_hash(&next))
                .count()
                >= 2
        })
    })
}

fn can_claim_fifty_moves(pos: &Chess) -> bool {
    let legal = pos.legal_moves();
    if pos.halfmoves() >= 100 {
        return !legal.is_empty();
    }
    if pos.halfmoves() >= 99 {
        return legal.into_iter().any(|mv| {
            !mv.is_zeroing()
                && pos
                    .clone()
                    .play(mv)
                    .is_ok_and(|next| next.halfmoves() >= 100 && !next.legal_moves().is_empty())
        });
    }
    false
}

fn state_from_board(
    pos: &Chess,
    history: &Json,
    start_fen: &str,
    position_history: &[Zobrist64],
    fullmove_number: Option<u32>,
) -> Json {
    let history_len = history.as_array().map(|a| a.len()).unwrap_or(0);
    let is_insufficient = pos.is_insufficient_material();
    let is_seventyfive_moves = is_seventyfive_moves(pos);
    let is_fivefold_repetition = is_fivefold_repetition(pos, position_history);
    let is_threefold_repetition = can_claim_threefold(pos, position_history);
    let is_fifty_moves = can_claim_fifty_moves(pos);
    let (status, winner) = if pos.is_checkmate() {
        (
            "checkmate",
            Some(if pos.turn() == Color::White {
                "black"
            } else {
                "white"
            }),
        )
    } else if pos.is_stalemate() {
        ("stalemate", Some("draw"))
    } else if is_insufficient
        || is_seventyfive_moves
        || is_fivefold_repetition
        || is_fifty_moves
        || is_threefold_repetition
    {
        ("draw", Some("draw"))
    } else {
        ("playing", None)
    };
    let mut pgn = String::new();
    if let Some(items) = history.as_array() {
        for (index, item) in items.iter().enumerate() {
            let san = item.get("san").and_then(Value::as_str).unwrap_or("");
            if item.get("by").and_then(Value::as_str) == Some("white") {
                if !pgn.is_empty() {
                    pgn.push(' ');
                }
                pgn.push_str(&format!("{}. {san}", index / 2 + 1));
            } else {
                pgn.push(' ');
                pgn.push_str(san);
            }
        }
    }
    let fullmove_number = fullmove_number.unwrap_or_else(|| pos.fullmoves().get());
    let fen = Fen::from_position(pos, EnPassantMode::Legal).to_string();
    let fen = fen.rsplit_once(' ').map_or(fen.clone(), |(prefix, _)| {
        format!("{prefix} {fullmove_number}")
    });
    json!({
        "fen": fen,
        "pgn": pgn.trim(),
        "turn": if pos.turn() == Color::White { "white" } else { "black" },
        "phase": phase(pos, history_len),
        "status": status,
        "fullMoveNumber": fullmove_number,
        "halfMoveClock": pos.halfmoves(),
        "isCheck": pos.is_check(),
        "isCheckmate": pos.is_checkmate(),
        "isStalemate": pos.is_stalemate(),
        "isDraw": status == "draw" || pos.is_stalemate(),
        "isInsufficientMaterial": is_insufficient,
        "isThreefoldRepetition": is_threefold_repetition,
        "winner": winner,
        "moveHistory": history,
        "startFen": start_fen,
        "openingMatch": Value::Null,
    })
}

fn make_move(
    game: &Json,
    from: &str,
    to: &str,
    promotion: Option<&str>,
) -> Result<(Json, Json), CommandRejected> {
    let fen = game.get("fen").and_then(Value::as_str).unwrap_or("");
    let pos = board_from_fen(fen)?;
    if Square::from_ascii(from.as_bytes()).is_err() || Square::from_ascii(to.as_bytes()).is_err() {
        return Err(CommandRejected::new("Invalid square"));
    }
    if let Some(promo) = promotion {
        if parse_role(promo).is_none() {
            return Err(CommandRejected::new("Invalid promotion"));
        }
    }
    let uci = format!("{from}{to}{}", promotion.unwrap_or(""));
    let parsed: UciMove = uci
        .parse()
        .map_err(|_| CommandRejected::new("Invalid move"))?;
    let mv = parsed
        .to_move(&pos)
        .map_err(|_| CommandRejected::new("Invalid move"))?;
    if !pos.is_legal(mv) {
        return Err(CommandRejected::new("Invalid move"));
    }
    let from_sq =
        Square::from_ascii(from.as_bytes()).map_err(|_| CommandRejected::new("Invalid square"))?;
    let piece = pos
        .board()
        .piece_at(from_sq)
        .ok_or_else(|| CommandRejected::new("Invalid move"))?;
    let to_sq =
        Square::from_ascii(to.as_bytes()).map_err(|_| CommandRejected::new("Invalid square"))?;
    let mut captured = pos.board().piece_at(to_sq);
    if mv.is_en_passant() {
        captured = Some(shakmaty::Piece {
            role: Role::Pawn,
            color: !pos.turn(),
        });
    }
    let san = SanPlus::from_move(pos.clone(), mv).to_string();
    let is_castling = mv.is_castle();
    let is_en_passant = mv.is_en_passant();
    let is_promotion = mv.promotion().is_some();
    let mover = if pos.turn() == Color::White {
        "white"
    } else {
        "black"
    };
    let previous_hash = position_hash(&pos);
    let fullmove_number = fen
        .split_whitespace()
        .nth(5)
        .and_then(|number| number.parse::<u32>().ok())
        .unwrap_or_else(|| pos.fullmoves().get())
        .saturating_add(if pos.turn() == Color::Black { 1 } else { 0 });
    let next = pos
        .play(mv)
        .map_err(|_| CommandRejected::new("Invalid move"))?;
    let position_history = [previous_hash, position_hash(&next)];
    let mut move_info = json!({
        "by": mover,
        "move": {"piece": role_name(piece.role), "from": from, "to": to},
        "piece": role_name(piece.role),
        "san": san,
        "isCheck": next.is_check(),
        "isCheckmate": next.is_checkmate(),
        "isStalemate": next.is_stalemate(),
        "isCastling": is_castling,
        "isEnPassant": is_en_passant,
        "isPromotion": is_promotion,
    });
    if let Some(captured) = captured {
        move_info["captured"] = json!(role_name(captured.role));
    }
    if let Some(promotion) = promotion {
        move_info["move"]["promotion"] = json!(promotion);
        move_info["promotionPiece"] = json!(promotion);
    }
    let mut history = game.get("moveHistory").cloned().unwrap_or(json!([]));
    if let Some(items) = history.as_array_mut() {
        items.push(move_info.clone())
    }
    let start = game.get("startFen").and_then(Value::as_str).unwrap_or(fen);
    Ok((
        state_from_board(
            &next,
            &history,
            start,
            &position_history,
            Some(fullmove_number),
        ),
        move_info,
    ))
}

fn undo_plies(game: &Json, plies: usize) -> Result<Json, CommandRejected> {
    let history = game
        .get("moveHistory")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    if plies < 1 || history.len() < plies {
        return Err(CommandRejected::new("Not enough moves to take back"));
    }
    let kept = Value::Array(history[..history.len() - plies].to_vec());
    let start = game.get("startFen").and_then(Value::as_str).unwrap_or("");
    let mut pos = board_from_fen(start)?;
    let mut position_history = vec![position_hash(&pos)];
    if let Some(items) = kept.as_array() {
        for item in items {
            let from = item
                .pointer("/move/from")
                .and_then(Value::as_str)
                .unwrap_or("");
            let to = item
                .pointer("/move/to")
                .and_then(Value::as_str)
                .unwrap_or("");
            let promo = item
                .pointer("/move/promotion")
                .and_then(Value::as_str)
                .unwrap_or("");
            let uci = format!("{from}{to}{promo}");
            let parsed: UciMove = uci
                .parse()
                .map_err(|_| CommandRejected::new("Invalid move"))?;
            let mv = parsed
                .to_move(&pos)
                .map_err(|_| CommandRejected::new("Invalid move"))?;
            pos.play_unchecked(mv);
            position_history.push(position_hash(&pos));
        }
    }
    let black_moves = kept
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter(|item| item.get("by").and_then(Value::as_str) == Some("black"))
                .count() as u32
        })
        .unwrap_or(0);
    let fullmove_number = start
        .split_whitespace()
        .nth(5)
        .and_then(|number| number.parse::<u32>().ok())
        .unwrap_or_else(|| pos.fullmoves().get())
        .saturating_add(black_moves);
    Ok(state_from_board(
        &pos,
        &kept,
        start,
        &position_history,
        Some(fullmove_number),
    ))
}

fn game_over_events(game: &Json, player_side: &str) -> Vec<Json> {
    if game.get("status").and_then(Value::as_str) == Some("playing") {
        return Vec::new();
    }
    let winner = game.get("winner").and_then(Value::as_str).unwrap_or("draw");
    let outcome = if winner == "draw" {
        "draw"
    } else if winner == player_side {
        "win"
    } else {
        "loss"
    };
    vec![
        json!({"type": "game_over", "result": game["status"], "winner": game["winner"], "playerSide": player_side}),
        json!({"type": "game_outcome", "outcome": outcome, "reason": game["status"]}),
    ]
}

fn settings(previous: &Json, mode: &str, cmd: &Json) -> Result<Json, CommandRejected> {
    if mode == "tutorial" {
        let mut next = previous.clone();
        next["playerSide"] = json!("white");
        next["difficulty"] = json!("sleepy");
        return Ok(next);
    }
    let side = cmd.get("side").and_then(Value::as_str).unwrap_or("");
    let difficulty = cmd.get("difficulty").and_then(Value::as_str).unwrap_or("");
    if side != "white" && side != "black" {
        return Err(CommandRejected::new("side must be white or black"));
    }
    if !matches!(
        difficulty,
        "sleepy" | "casual" | "normal" | "focused" | "serious"
    ) {
        return Err(CommandRejected::new("Invalid difficulty"));
    }
    let mut next = previous.clone();
    next["playerSide"] = json!(side);
    next["difficulty"] = json!(difficulty);
    Ok(next)
}

pub fn reduce(state: &Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let command_type = cmd.get("type").and_then(Value::as_str).unwrap_or("");
    let mut state = state.clone();
    match command_type {
        "startGame" => {
            let mode = cmd.get("mode").and_then(Value::as_str).unwrap_or("");
            if mode != "normal" && mode != "tutorial" {
                return Err(CommandRejected::new("mode must be normal or tutorial"));
            }
            if actor == "agent"
                && state.pointer("/gameState/status").and_then(Value::as_str) == Some("playing")
            {
                return Err(CommandRejected::new(
                    "A game is already in progress — only the player may start a new one",
                ));
            }
            let settings = settings(state.get("settings").unwrap_or(&json!({})), mode, cmd)?;
            let start = Chess::default();
            let start_fen = Fen::from_position(&start, shakmaty::EnPassantMode::Legal).to_string();
            let game = state_from_board(
                &start,
                &json!([]),
                &start_fen,
                &[position_hash(&start)],
                Some(start.fullmoves().get()),
            );
            state["settings"] = settings.clone();
            state["gameState"] = game;
            state["drawOffer"] = Value::Null;
            state["takebackRequest"] = Value::Null;
            state["tutorial"] = if mode == "tutorial" {
                json!({"step": tutorial_steps()[0]["id"]})
            } else {
                Value::Null
            };
            state["debugScenarioId"] = Value::Null;
            state["debugScenario"] = Value::Null;
            Ok(ReducerResult::new(
                state,
                json!({"success": true}),
                vec![
                    json!({"type": "game_start", "playerSide": settings["playerSide"], "difficulty": settings["difficulty"]}),
                ],
            ))
        }
        "debugLoadScenario" => {
            if actor != "player" {
                return Err(CommandRejected::new("Only player may load debug scenarios"));
            }
            let scenario_id = cmd.get("scenarioId").and_then(Value::as_str).unwrap_or("");
            let Some(fixture) = debug_scenarios().get(scenario_id).cloned() else {
                return Err(CommandRejected::new("Unknown Chess debug scenario"));
            };
            let start_fen = fixture
                .get("startFen")
                .and_then(Value::as_str)
                .unwrap_or("");
            let mut pos = board_from_fen(start_fen).map_err(|_| {
                CommandRejected::new(format!("Invalid debug start position: {start_fen}"))
            })?;
            let fullmove_number = start_fen
                .split_whitespace()
                .nth(5)
                .and_then(|number| number.parse::<u32>().ok());
            let mut game = state_from_board(
                &pos,
                &json!([]),
                start_fen,
                &[position_hash(&pos)],
                fullmove_number,
            );
            let script = fixture
                .get("script")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let start_ply = fixture
                .get("startPly")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as usize;
            if start_ply > script.len() {
                return Err(CommandRejected::new("Invalid debug start ply"));
            }
            for step in script.iter().take(start_ply) {
                let uci = step.get("uci").and_then(Value::as_str).unwrap_or("");
                if uci.len() != 4 && uci.len() != 5 {
                    return Err(CommandRejected::new("Invalid debug move"));
                }
                let promo = if uci.len() == 5 {
                    Some(&uci[4..])
                } else {
                    None
                };
                let (next, mut info) = make_move(&game, &uci[..2], &uci[2..4], promo)?;
                game = next;
                if let Some(ms) = step.get("durationMs").and_then(|v| v.as_i64()) {
                    info["durationMs"] = json!(ms);
                    let len = game
                        .get("moveHistory")
                        .and_then(Value::as_array)
                        .map(|a| a.len())
                        .unwrap_or(0);
                    if len > 0 {
                        game["moveHistory"][len - 1] = info;
                    }
                }
                let _ = &mut pos;
            }
            state["settings"] = fixture.get("settings").cloned().unwrap_or(json!({}));
            state["gameState"] = game;
            state["drawOffer"] = Value::Null;
            state["takebackRequest"] = Value::Null;
            state["tutorial"] = Value::Null;
            state["debugScenarioId"] = json!(scenario_id);
            state["debugScenario"] = json!({"script": script, "nextPly": start_ply});
            Ok(ReducerResult::new(
                state,
                json!({"success": true}),
                vec![json!({"type": "debug_scenario_loaded", "scenarioId": scenario_id})],
            ))
        }
        _ => play_command(&mut state, actor, cmd, command_type),
    }
}

fn play_command(
    state: &mut Json,
    actor: &str,
    cmd: &Json,
    command_type: &str,
) -> Result<ReducerResult, CommandRejected> {
    let Some(game) = state.get("gameState").cloned().filter(|g| g.is_object()) else {
        return Err(CommandRejected::new("Game not started"));
    };
    let tutorial_id = state
        .pointer("/tutorial/step")
        .and_then(Value::as_str)
        .map(str::to_string);
    let guided = tutorial_id.as_deref().is_some_and(|id| id != "free_play");
    let steps = tutorial_steps();
    let tutorial_index = tutorial_id.as_deref().and_then(|id| {
        steps.as_array().and_then(|items| {
            items
                .iter()
                .position(|step| step.get("id").and_then(Value::as_str) == Some(id))
        })
    });
    if guided && tutorial_index.is_none() {
        return Err(CommandRejected::new("Unknown tutorial step"));
    }
    if guided && command_type != "move" {
        return Err(CommandRejected::new(
            "Complete the guided opening before using game actions",
        ));
    }
    match command_type {
        "move" => {
            let side = side_for_actor(state, actor)?;
            if game.get("status").and_then(Value::as_str) != Some("playing") {
                return Err(CommandRejected::new("Game is not in progress"));
            }
            if game.get("turn").and_then(Value::as_str) != Some(side.as_str()) {
                return Err(CommandRejected::new("Not your turn"));
            }
            let from = cmd.get("from").and_then(Value::as_str);
            let to = cmd.get("to").and_then(Value::as_str);
            let promotion = cmd.get("promotion");
            if promotion.is_some()
                && !promotion.unwrap().is_null()
                && promotion.and_then(Value::as_str).is_none()
            {
                return Err(CommandRejected::new("Invalid move payload"));
            }
            let (Some(from), Some(to)) = (from, to) else {
                return Err(CommandRejected::new("Invalid move payload"));
            };
            let promotion = promotion.and_then(Value::as_str);
            if guided {
                let expected = &steps[tutorial_index.unwrap()];
                let expected_move = expected.get("move").cloned().unwrap_or(json!({}));
                if actor != expected.get("mover").and_then(Value::as_str).unwrap_or("")
                    || expected_move.get("from").and_then(Value::as_str) != Some(from)
                    || expected_move.get("to").and_then(Value::as_str) != Some(to)
                    || promotion.is_some()
                {
                    return Err(CommandRejected::new("Follow the highlighted tutorial move"));
                }
            }
            if let Some(debug) = state
                .get("debugScenario")
                .filter(|debug| debug.is_object())
                .cloned()
            {
                let next_ply = debug.get("nextPly").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                let script = debug
                    .get("script")
                    .and_then(Value::as_array)
                    .cloned()
                    .unwrap_or_default();
                if next_ply < script.len() {
                    let expected = script[next_ply]
                        .get("uci")
                        .and_then(Value::as_str)
                        .unwrap_or("");
                    let actual = format!("{from}{to}{}", promotion.unwrap_or(""));
                    if actual != expected {
                        return Err(CommandRejected::new(
                            "Follow the loaded debug scenario move",
                        ));
                    }
                }
            }
            let (mut next_game, mut move_info) = make_move(&game, from, to, promotion)?;
            let now = now_ms();
            let previous = game
                .get("moveHistory")
                .and_then(Value::as_array)
                .and_then(|h| h.last())
                .and_then(|item| item.get("madeAtMs"))
                .and_then(|v| v.as_i64());
            move_info["madeAtMs"] = json!(now);
            if let Some(previous) = previous {
                move_info["durationMs"] = json!((now - previous).max(0));
            }
            let len = next_game
                .get("moveHistory")
                .and_then(Value::as_array)
                .map(|a| a.len())
                .unwrap_or(0);
            if len > 0 {
                next_game["moveHistory"][len - 1] = move_info.clone();
            }
            if let Some(debug) = state
                .get_mut("debugScenario")
                .filter(|debug| debug.is_object())
            {
                let next_ply = debug.get("nextPly").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                if let Some(scripted) = debug
                    .get("script")
                    .and_then(Value::as_array)
                    .and_then(|s| s.get(next_ply))
                {
                    if let Some(ms) = scripted.get("durationMs").and_then(|v| v.as_i64()) {
                        move_info["durationMs"] = json!(ms);
                        next_game["moveHistory"][len - 1] = move_info.clone();
                    }
                }
                debug["nextPly"] = json!(next_ply + 1);
            }
            state["gameState"] = next_game.clone();
            state["drawOffer"] = Value::Null;
            state["takebackRequest"] = Value::Null;
            let mut events = vec![json!({"type": "move", "by": side, "details": move_info})];
            if move_info.get("isCheck").and_then(Value::as_bool) == Some(true) {
                events.push(json!({"type": "check", "by": side, "from": {"piece": move_info["move"]["piece"], "square": from}}));
            }
            if let Some(captured) = move_info.get("captured") {
                events.push(json!({"type": "capture", "by": side, "from": {"piece": move_info["move"]["piece"], "square": from}, "captured": {"piece": captured, "square": to}}));
            }
            if move_info.get("isCastling").and_then(Value::as_bool) == Some(true) {
                events.push(json!({"type": "castling", "by": side, "side": if to.starts_with('g') { "kingside" } else { "queenside" }}));
            }
            if move_info.get("isPromotion").and_then(Value::as_bool) == Some(true) {
                events.push(json!({"type": "promotion", "by": side, "from": {"piece": "p", "square": from}, "promotion": promotion}));
            }
            if guided {
                let next_index = tutorial_index.unwrap() + 1;
                let step = steps
                    .as_array()
                    .and_then(|items| items.get(next_index))
                    .and_then(|step| step.get("id"))
                    .cloned()
                    .unwrap_or(json!("free_play"));
                state["tutorial"] = json!({"step": step});
                events.push(json!({"type": "tutorial_step", "step": tutorial_id}));
            }
            let player_side = state
                .pointer("/settings/playerSide")
                .and_then(Value::as_str)
                .unwrap_or("white")
                .to_string();
            events.extend(game_over_events(&next_game, &player_side));
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true, "move": move_info}),
                events,
            ))
        }
        "resign" => {
            if game.get("status").and_then(Value::as_str) != Some("playing") {
                return Err(CommandRejected::new("Game is not in progress"));
            }
            let side = side_for_actor(state, actor)?;
            state["gameState"]["status"] = json!("resigned");
            state["gameState"]["winner"] = json!(if side == "white" { "black" } else { "white" });
            state["gameState"]["isCheck"] = json!(false);
            state["gameState"]["isCheckmate"] = json!(false);
            state["gameState"]["isStalemate"] = json!(false);
            let player_side = state
                .pointer("/settings/playerSide")
                .and_then(Value::as_str)
                .unwrap_or("white")
                .to_string();
            let events = game_over_events(&state["gameState"], &player_side);
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                events,
            ))
        }
        "offerDraw" => {
            if game.get("status").and_then(Value::as_str) != Some("playing")
                || state.get("drawOffer").is_some_and(|v| !v.is_null())
            {
                return Err(CommandRejected::new("Cannot offer a draw"));
            }
            let side = side_for_actor(state, actor)?;
            state["drawOffer"] = json!(side);
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                vec![json!({"type": "draw_offer", "side": side})],
            ))
        }
        "cancelDrawOffer" => {
            let side = side_for_actor(state, actor)?;
            if state.get("drawOffer").and_then(Value::as_str) != Some(side.as_str()) {
                return Err(CommandRejected::new("No draw offer from this side"));
            }
            state["drawOffer"] = Value::Null;
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                vec![json!({"type": "cancel_draw_offer", "side": side})],
            ))
        }
        "respondDraw" => {
            let side = side_for_actor(state, actor)?;
            let offered = state
                .get("drawOffer")
                .and_then(Value::as_str)
                .map(str::to_string);
            let accept = cmd.get("accept").and_then(Value::as_bool);
            if offered.is_none() || offered.as_deref() == Some(side.as_str()) || accept.is_none() {
                return Err(CommandRejected::new("Invalid draw response"));
            }
            state["drawOffer"] = Value::Null;
            let mut events =
                vec![json!({"type": "respond_draw", "respondSide": side, "accept": accept})];
            if accept == Some(true) {
                state["gameState"]["status"] = json!("draw");
                state["gameState"]["winner"] = json!("draw");
                state["gameState"]["isDraw"] = json!(true);
                state["gameState"]["isCheck"] = json!(false);
                state["gameState"]["isCheckmate"] = json!(false);
                state["gameState"]["isStalemate"] = json!(false);
                let player_side = state
                    .pointer("/settings/playerSide")
                    .and_then(Value::as_str)
                    .unwrap_or("white")
                    .to_string();
                events.extend(game_over_events(&state["gameState"], &player_side));
            }
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                events,
            ))
        }
        "requestTakeback" => {
            let side = side_for_actor(state, actor)?;
            let needed = if game.get("turn").and_then(Value::as_str) == Some(side.as_str()) {
                2
            } else {
                1
            };
            let len = game
                .get("moveHistory")
                .and_then(Value::as_array)
                .map(|a| a.len())
                .unwrap_or(0);
            if state.get("takebackRequest").is_some_and(|v| !v.is_null()) || len < needed {
                return Err(CommandRejected::new("Cannot request takeback"));
            }
            state["takebackRequest"] = json!(side);
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                vec![json!({"type": "request_takeback", "side": side})],
            ))
        }
        "cancelTakebackRequest" => {
            let side = side_for_actor(state, actor)?;
            if state.get("takebackRequest").and_then(Value::as_str) != Some(side.as_str()) {
                return Err(CommandRejected::new("No takeback request from this side"));
            }
            state["takebackRequest"] = Value::Null;
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                vec![json!({"type": "cancel_takeback_request", "side": side})],
            ))
        }
        "respondTakeback" => {
            let side = side_for_actor(state, actor)?;
            let requested = state
                .get("takebackRequest")
                .and_then(Value::as_str)
                .map(str::to_string);
            let accept = cmd.get("accept").and_then(Value::as_bool);
            if requested.is_none()
                || requested.as_deref() == Some(side.as_str())
                || accept.is_none()
            {
                return Err(CommandRejected::new("Invalid takeback response"));
            }
            let needed = if game.get("turn").and_then(Value::as_str) == requested.as_deref() {
                2
            } else {
                1
            };
            state["takebackRequest"] = Value::Null;
            let mut events =
                vec![json!({"type": "respond_takeback", "respondSide": side, "accept": accept})];
            if accept == Some(true) {
                let old = game
                    .get("moveHistory")
                    .and_then(Value::as_array)
                    .map(|a| a.len())
                    .unwrap_or(0);
                state["gameState"] = undo_plies(&game, needed)?;
                events.push(json!({
                    "type": "history_rewound",
                    "pliesUndone": needed,
                    "prevPly": old,
                    "nextPly": state.pointer("/gameState/moveHistory").and_then(Value::as_array).map(|a| a.len()).unwrap_or(0),
                    "fen": state.pointer("/gameState/fen").cloned().unwrap_or(Value::Null),
                }));
            }
            Ok(ReducerResult::new(
                state.clone(),
                json!({"success": true}),
                events,
            ))
        }
        _ => Err(CommandRejected::new(format!(
            "Unknown chess command: {command_type}"
        ))),
    }
}

pub fn agent_next_command(state: &Json) -> Option<Json> {
    let game = state.get("gameState")?;
    if game.get("status").and_then(Value::as_str) != Some("playing") {
        return None;
    }
    let agent_side = side_for_actor(state, "agent").ok()?;
    if game.get("turn").and_then(Value::as_str) != Some(agent_side.as_str()) {
        return None;
    }
    if let Some(debug) = state.get("debugScenario") {
        let next_ply = debug.get("nextPly").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
        if let Some(uci) = debug
            .get("script")
            .and_then(Value::as_array)
            .and_then(|s| s.get(next_ply))
            .and_then(|s| s.get("uci"))
            .and_then(Value::as_str)
        {
            if uci.len() == 4 || uci.len() == 5 {
                let mut command = json!({"type": "move", "from": &uci[..2], "to": &uci[2..4]});
                if uci.len() == 5 {
                    command["promotion"] = json!(&uci[4..]);
                }
                return Some(command);
            }
        }
    }
    if let Some(step_id) = state.pointer("/tutorial/step").and_then(Value::as_str) {
        if step_id != "free_play" {
            let steps = tutorial_steps();
            let step = steps
                .as_array()?
                .iter()
                .find(|step| step.get("id").and_then(Value::as_str) == Some(step_id))?;
            if step.get("mover").and_then(Value::as_str) != Some("agent") {
                return None;
            }
            let mut command = json!({"type": "move"});
            if let Some(mv) = step.get("move").and_then(Value::as_object) {
                for (k, v) in mv {
                    command[k] = v.clone();
                }
            }
            return Some(command);
        }
    }
    let fen = game.get("fen").and_then(Value::as_str)?;
    let pos = board_from_fen(fen).ok()?;
    let legal = pos.legal_moves();
    let mv: Move = if state
        .pointer("/settings/difficulty")
        .and_then(Value::as_str)
        == Some("sleepy")
    {
        *legal.iter().next()?
    } else {
        **legal.iter().collect::<Vec<_>>().choose(&mut rand::rng())?
    };
    let mut command = json!({"type": "move", "from": mv.from().unwrap_or(mv.to()).to_string(), "to": mv.to().to_string()});
    if let Some(role) = mv.promotion() {
        command["promotion"] = json!(role_name(role));
    }
    Some(command)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn started(mode: &str) -> Json {
        reduce(
            &initial_state(),
            "player",
            &json!({"type": "startGame", "mode": mode, "side": "white", "difficulty": "casual"}),
        )
        .unwrap()
        .state
    }

    fn play(state: &Json, actor: &str, from: &str, to: &str) -> Json {
        reduce(
            state,
            actor,
            &json!({"type": "move", "from": from, "to": to}),
        )
        .unwrap()
        .state
    }

    fn reject_unchanged(state: &Json, actor: &str, command: Json, expected: &str) {
        let before = state.clone();
        let error = reduce(state, actor, &command).unwrap_err();
        assert_eq!(error.0, expected);
        assert_eq!(*state, before);
    }

    #[test]
    fn chess_start_move_san_turn_and_agent_reply() {
        let mut state = started("normal");
        state = play(&state, "player", "e2", "e4");
        assert_eq!(
            state.pointer("/gameState/turn").and_then(Value::as_str),
            Some("black")
        );
        assert_eq!(
            state
                .pointer("/gameState/moveHistory/0/san")
                .and_then(Value::as_str),
            Some("e4")
        );
        let command = agent_next_command(&state).expect("agent should reply");
        assert_eq!(command["type"], "move");
        state = reduce(&state, "agent", &command).unwrap().state;
        assert_eq!(
            state.pointer("/gameState/turn").and_then(Value::as_str),
            Some("white")
        );
    }

    #[test]
    fn chess_all_33_debug_scenarios_load_and_offer_scripted_move() {
        let fixtures = debug_scenarios();
        assert_eq!(fixtures.as_object().map_or(0, serde_json::Map::len), 33);
        for (scenario_id, fixture) in fixtures.as_object().unwrap() {
            let result = reduce(
                &initial_state(),
                "player",
                &json!({"type": "debugLoadScenario", "scenarioId": scenario_id}),
            )
            .unwrap();
            assert_eq!(result.result, json!({"success": true}));
            assert_eq!(
                result.events,
                vec![json!({"type": "debug_scenario_loaded", "scenarioId": scenario_id})]
            );
            let state = result.state;
            let game = &state["gameState"];
            let start_ply = fixture["startPly"].as_u64().unwrap() as usize;
            assert_eq!(state["debugScenarioId"], *scenario_id);
            assert_eq!(state["settings"], fixture["settings"]);
            assert_eq!(game["startFen"], fixture["startFen"]);
            let fen = game["fen"].as_str().unwrap();
            assert_eq!(
                game["fullMoveNumber"],
                fen.split_whitespace()
                    .nth(5)
                    .unwrap()
                    .parse::<u32>()
                    .unwrap()
            );
            if start_ply == 0 {
                assert_eq!(fen, fixture["startFen"]);
            }
            assert_eq!(game["moveHistory"].as_array().unwrap().len(), start_ply);
            assert_eq!(
                state
                    .pointer("/debugScenario/nextPly")
                    .and_then(Value::as_u64),
                Some(start_ply as u64)
            );
            if start_ply < fixture["script"].as_array().unwrap().len() {
                let player_side = fixture
                    .pointer("/settings/playerSide")
                    .and_then(Value::as_str)
                    .unwrap();
                let agent_side = if player_side == "white" {
                    "black"
                } else {
                    "white"
                };
                if game["turn"].as_str() == Some(agent_side) {
                    let uci = fixture
                        .pointer(&format!("/script/{start_ply}/uci"))
                        .and_then(Value::as_str)
                        .unwrap();
                    let mut expected = json!({"type": "move", "from": &uci[..2], "to": &uci[2..4]});
                    if uci.len() == 5 {
                        expected["promotion"] = json!(&uci[4..]);
                    }
                    assert_eq!(agent_next_command(&state), Some(expected), "{scenario_id}");
                } else {
                    assert_eq!(agent_next_command(&state), None, "{scenario_id}");
                }
            }
        }
    }

    #[test]
    fn chess_tutorial_script_rejects_out_of_sequence_without_mutation() {
        let steps = tutorial_steps();
        assert_eq!(steps.as_array().unwrap().len(), 22);
        let mut state = started("tutorial");
        assert_eq!(
            state
                .pointer("/settings/playerSide")
                .and_then(Value::as_str),
            Some("white")
        );
        assert_eq!(
            state
                .pointer("/settings/difficulty")
                .and_then(Value::as_str),
            Some("sleepy")
        );

        for (index, step) in steps.as_array().unwrap().iter().enumerate() {
            let id = step["id"].as_str().unwrap();
            assert_eq!(
                state.pointer("/tutorial/step").and_then(Value::as_str),
                Some(id)
            );
            for command_type in ["resign", "offerDraw", "requestTakeback"] {
                reject_unchanged(
                    &state,
                    "player",
                    json!({"type": command_type}),
                    "Complete the guided opening before using game actions",
                );
            }
            if index == 0 {
                reject_unchanged(
                    &state,
                    "player",
                    json!({"type": "move", "from": "d2", "to": "d4"}),
                    "Follow the highlighted tutorial move",
                );
                reject_unchanged(
                    &state,
                    "player",
                    json!({"type": "move", "from": "e2", "to": "e4", "promotion": "q"}),
                    "Follow the highlighted tutorial move",
                );
            }
            if index == 1 {
                reject_unchanged(
                    &state,
                    "agent",
                    json!({"type": "move", "from": "d7", "to": "d5"}),
                    "Follow the highlighted tutorial move",
                );
            }
            let mover = step["mover"].as_str().unwrap();
            let mv = &step["move"];
            let command = json!({"type": "move", "from": mv["from"], "to": mv["to"]});
            if mover == "agent" {
                assert_eq!(agent_next_command(&state), Some(command.clone()));
            } else {
                assert_eq!(agent_next_command(&state), None);
            }
            let wrong_actor = if mover == "player" { "agent" } else { "player" };
            reject_unchanged(&state, wrong_actor, command.clone(), "Not your turn");
            let result = reduce(&state, mover, &command).unwrap();
            assert!(result
                .events
                .iter()
                .any(|event| event["type"] == "tutorial_step" && event["step"] == id));
            state = result.state;
            assert_eq!(
                state
                    .pointer("/gameState/moveHistory")
                    .and_then(Value::as_array)
                    .unwrap()
                    .len(),
                index + 1
            );
            if matches!(index, 16 | 17) {
                assert_eq!(
                    state["gameState"]["moveHistory"]
                        .as_array()
                        .unwrap()
                        .last()
                        .unwrap()["isCastling"],
                    true
                );
            }
            if index == 11 {
                assert_eq!(
                    state.pointer("/gameState/isCheck").and_then(Value::as_bool),
                    Some(true)
                );
            }
            if index == 12 {
                assert_eq!(
                    state.pointer("/gameState/isCheck").and_then(Value::as_bool),
                    Some(false)
                );
            }
        }

        assert_eq!(
            state.pointer("/tutorial/step").and_then(Value::as_str),
            Some("free_play")
        );
        state = reduce(&state, "player", &json!({"type": "offerDraw"}))
            .unwrap()
            .state;
        state = reduce(&state, "player", &json!({"type": "cancelDrawOffer"}))
            .unwrap()
            .state;
        state = play(&state, "player", "a2", "a3");
        assert!(agent_next_command(&state).is_some());
        state = reduce(&state, "player", &json!({"type": "startGame", "mode": "normal", "side": "black", "difficulty": "casual"})).unwrap().state;
        assert!(state["tutorial"].is_null());
        state = reduce(
            &state,
            "player",
            &json!({"type": "startGame", "mode": "tutorial"}),
        )
        .unwrap()
        .state;
        assert_eq!(
            state.pointer("/tutorial/step").and_then(Value::as_str),
            steps[0]["id"].as_str()
        );
        assert!(state
            .pointer("/gameState/moveHistory")
            .and_then(Value::as_array)
            .unwrap()
            .is_empty());
    }

    #[test]
    fn chess_takeback_replay_detects_claimable_threefold_repetition() {
        let mut state = started("normal");
        for _ in 0..2 {
            state = play(&state, "player", "g1", "f3");
            state = play(&state, "agent", "g8", "f6");
            state = play(&state, "player", "f3", "g1");
            state = play(&state, "agent", "f6", "g8");
        }
        assert_eq!(
            state.pointer("/gameState/status").and_then(Value::as_str),
            Some("playing")
        );
        state = reduce(&state, "agent", &json!({"type": "requestTakeback"}))
            .unwrap()
            .state;
        let response = reduce(
            &state,
            "player",
            &json!({"type": "respondTakeback", "accept": true}),
        )
        .unwrap();
        state = response.state;
        assert_eq!(response.events[1]["pliesUndone"], 1);
        assert_eq!(
            state.pointer("/gameState/status").and_then(Value::as_str),
            Some("draw")
        );
        assert_eq!(
            state
                .pointer("/gameState/isThreefoldRepetition")
                .and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(
            state
                .pointer("/gameState/moveHistory")
                .and_then(Value::as_array)
                .unwrap()
                .len(),
            7
        );
    }

    #[test]
    fn chess_seventyfive_moves_and_fivefold_repetition_draw_rules() {
        let fen = "7k/8/8/8/8/8/6R1/K7 w - - 150 1";
        let pos = board_from_fen(fen).unwrap();
        let hash = position_hash(&pos);
        let game = state_from_board(&pos, &json!([]), fen, &[hash], Some(pos.fullmoves().get()));
        assert_eq!(game["status"], "draw");
        assert_eq!(game["halfMoveClock"], 150);
        assert!(is_seventyfive_moves(&pos));
        assert!(!is_fivefold_repetition(&pos, &[hash; 4]));
        assert!(is_fivefold_repetition(&pos, &[hash; 5]));
    }

    #[test]
    fn chess_halfmove_99_can_claim_fifty_moves() {
        let fen = "7k/8/8/8/8/8/6R1/K7 w - - 99 1";
        let pos = board_from_fen(fen).unwrap();
        let game = state_from_board(
            &pos,
            &json!([]),
            fen,
            &[position_hash(&pos)],
            Some(pos.fullmoves().get()),
        );
        assert_eq!(game["halfMoveClock"], 99);
        assert_eq!(game["status"], "draw");
        assert_eq!(game["winner"], "draw");
    }
}
