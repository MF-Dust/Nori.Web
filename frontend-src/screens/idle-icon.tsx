import type { CSSProperties } from "react";

const EMOJI_PREFIX = "emoji:";
const MEMENTO_PREFIX = "memento_";
const SKILL_SET_PATTERN = /^set([1-5])-(\d{2})$/;
const ABILITY_PATTERN = /^Ability_icons\d+_\d+$/;
const COLOR_ICON_PATTERN = /^([a-z][a-z0-9-]*)-(\d{2,})$/;

export type IdleIconRenderMode = "emoji" | "mask" | "color";

export interface ResolvedIdleIcon {
  src: string;
  render: IdleIconRenderMode;
}

/** Exact icon-path dispatch recovered from shipped IdleScreen `dt()`. */
export function resolveIdleIcon(name: string): ResolvedIdleIcon {
  if (name.startsWith(EMOJI_PREFIX)) {
    return { src: name.slice(EMOJI_PREFIX.length), render: "emoji" };
  }
  if (name.startsWith(MEMENTO_PREFIX)) {
    return { src: `/icons/memento/${name}.png`, render: "mask" };
  }
  const skillSet = SKILL_SET_PATTERN.exec(name);
  if (skillSet) {
    return {
      src: `/icons/skills/set${skillSet[1]}-white/skill-${skillSet[2]}.png`,
      render: "mask",
    };
  }
  if (ABILITY_PATTERN.test(name)) {
    return { src: `/icons/abilities/${name}.png`, render: "color" };
  }
  const colorIcon = COLOR_ICON_PATTERN.exec(name);
  if (colorIcon) {
    return { src: `/icons/${colorIcon[1]}/${name}.png`, render: "color" };
  }
  return { src: `/icons/idle/${name}`, render: "mask" };
}

const MASK_STYLE: CSSProperties = {
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  maskSize: "contain",
};

export function IdleIcon({
  name,
  className = "size-5",
}: {
  name: string;
  className?: string;
}) {
  const icon = resolveIdleIcon(name);
  if (icon.render === "emoji") {
    return (
      <svg viewBox="0 0 100 100" className={`shrink-0 ${className}`} aria-hidden="true">
        <text
          x="50"
          y="54"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="72"
        >
          {icon.src}
        </text>
      </svg>
    );
  }

  if (icon.render === "color") {
    return (
      <img
        src={icon.src}
        alt=""
        className={`shrink-0 object-contain ${className}`}
        style={{ imageRendering: "pixelated" }}
      />
    );
  }

  return (
    <div
      className={`shrink-0 bg-current ${className}`}
      style={{
        ...MASK_STYLE,
        WebkitMaskImage: `url(${icon.src})`,
        maskImage: `url(${icon.src})`,
        imageRendering: icon.src.endsWith(".png") ? "pixelated" : undefined,
      }}
      aria-hidden="true"
    />
  );
}
