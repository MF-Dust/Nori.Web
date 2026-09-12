# Source CSS ownership

The source app no longer loads the shipped `index-FU-0vwSE.css` or `NormalApp-B2xPBQgm.css`. Tailwind utilities are generated from `frontend-src` by pinned, lockfile-resolved Tailwind 4 and its Vite plugin. The built source app stylesheet is also used by the recovered games browser fixture.

The recovered rules preserve cascade order and original values. They were separated at CSS AST node boundaries, without renaming the old compiled stylesheet into the source tree. The original 267 KB utility layer and generated `--tw-*` property boilerplate are replaced by build-time generation.

| Source stylesheet | Responsibility / shipped origin |
| --- | --- |
| app.css | Imports, explicit cascade order, source scanning and dark variant |
| tokens.css | Theme utility mappings recovered from the original theme layer |
| globals.css | Root sizing, interaction defaults and browser glitch shielding |
| pixel.css | Idle pixel typography, controls, frames, tooltips and animation |
| base.css | App-specific reset overrides, colors and scrollbars; standard preflight comes from Tailwind |
| components.css | Original component-layer code formatting and Debug controls |
| nori-theme.css | Window glass, focus, Dock, notifications, vault, graphics modes, fonts, light/dark variables and app rules |
| desktop-shell.css | Dock icon layering and TopBar layout/theme from NormalApp's stylesheet |
| chess.css / pictionary.css / codenames-app.css | Source game presentation |

Other component styles stay beside their owners. Font/model/image assets remain in `public/`.

Validation uses a rebuilt application, Chromium checks of layout and utility-dependent controls, source app screenshots and the Chess/Pictionary browser scenarios. This establishes ownership of CSS generation; it does not establish visual parity for unrecovered game, scene or application behavior.
