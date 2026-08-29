import { useCallback, useEffect, useState, type CSSProperties } from "react";

export interface IntroHeroContent {
  pageTitle: string;
  logoAlt: string;
  tagline: string;
  requirementsBefore: string;
  requirementsDevice: string;
  requirementsAfter: string;
  start: string;
  note: string;
  mobileTitle: string;
  mobileBody: string;
}

export interface IntroStoryContent {
  eyebrow: string;
  source: string;
  headline: string;
  byline: string;
  photo: string;
  photoWidth: number;
  photoHeight: number;
  photoAlt: string;
  standfirst: string;
  pull: string;
  closing: string;
}

export interface IntroSteamContent {
  eyebrow: string;
  headline: string;
  body: string;
  widgetUrl: string;
}

export interface IntroNoticeContent {
  title: string;
  warning: string;
  selfContained: string;
  ai: string;
  network: string;
  fiction: string;
}

export interface IntroContactItem {
  label: string;
  value: string;
  href?: string;
}

export interface IntroContactContent {
  title: string;
  welcome: string;
  items: readonly IntroContactItem[];
  copyHint: string;
  copied: string;
  bookmarkBeforeKeys: string;
  bookmarkAfterKeys: string;
}

export interface IntroPageContent {
  hero: IntroHeroContent;
  story: IntroStoryContent;
  steam: IntroSteamContent;
  notice: IntroNoticeContent;
  contact: IntroContactContent;
}

export interface IntroPageProps {
  content: IntroPageContent;
  unsupportedMobile: boolean;
  onStart?: () => void;
  copyFeedbackMs?: number;
}

const DEFAULT_COPY_FEEDBACK_MS = 1_800;

function riseStyle(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export async function copyIntroText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the compatibility path used by the shipped page.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
  document.body.append(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}

function bookmarkShortcut(): string {
  return /Macintosh|Mac OS X/.test(navigator.userAgent) ? "⌘+D" : "Ctrl+D";
}

/**
 * Recovered structure and interaction model for the shipped IntroPage.
 * Product/editorial copy is intentionally supplied as data so maintenance no
 * longer requires editing the page component itself.
 */
export function IntroPage({
  content,
  unsupportedMobile,
  onStart = () => window.location.assign("/"),
  copyFeedbackMs = DEFAULT_COPY_FEEDBACK_MS,
}: IntroPageProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = content.hero.pageTitle;
    return () => {
      document.title = previous;
    };
  }, [content.hero.pageTitle]);

  useEffect(() => {
    if (!copiedValue) return;
    const timer = window.setTimeout(() => setCopiedValue(null), copyFeedbackMs);
    return () => window.clearTimeout(timer);
  }, [copiedValue, copyFeedbackMs]);

  const copy = useCallback((value: string) => {
    void copyIntroText(value).then((copied) => {
      if (copied) setCopiedValue(value);
    });
  }, []);

  const { hero, story, steam, contact, notice } = content;

  return (
    <div className="intro-root">
      <div aria-hidden className="intro-backdrop">
        <div className="intro-tide" />
      </div>

      <main className="intro-page">
        <header className="intro-hero intro-rise" style={riseStyle(0)}>
          <img
            className="intro-logo"
            src="/inori-logo.png"
            alt={hero.logoAlt}
            draggable={false}
          />
          <div className="intro-pitch">
            <p className="intro-tagline">{hero.tagline}</p>
            <p className="intro-requirements">
              {hero.requirementsBefore}
              <strong>{hero.requirementsDevice}</strong>
              {hero.requirementsAfter}
            </p>
          </div>
          {unsupportedMobile ? (
            <div className="intro-unsupported">
              <p className="intro-unsupported-title">{hero.mobileTitle}</p>
              <p className="intro-unsupported-body">{hero.mobileBody}</p>
            </div>
          ) : null}
        </header>

        <section className="intro-section intro-rise" style={riseStyle(1)}>
          <h2 className="intro-eyebrow">{story.eyebrow}</h2>
          <article className="intro-clip">
            <p className="intro-clip-source">{story.source}</p>
            <h3 className="intro-clip-headline">{story.headline}</h3>
            <p className="intro-clip-byline">{story.byline}</p>
            <img
              className="intro-clip-photo"
              src={story.photo}
              width={story.photoWidth}
              height={story.photoHeight}
              alt={story.photoAlt}
              loading="lazy"
              draggable={false}
            />
            <p className="intro-clip-standfirst">{story.standfirst}</p>
            <p className="intro-clip-pull">{story.pull}</p>
            <p className="intro-clip-body">{story.closing}</p>
          </article>
        </section>

        <section className="intro-section intro-rise" style={riseStyle(2)}>
          <h2 className="intro-eyebrow">{steam.eyebrow}</h2>
          <h3 className="intro-steam-headline">{steam.headline}</h3>
          <p className="intro-steam-body">{steam.body}</p>
          <iframe
            className="intro-steam-widget"
            src={steam.widgetUrl}
            title={steam.eyebrow}
            loading="lazy"
          />
        </section>

        <section className="intro-section intro-rise" style={riseStyle(3)}>
          <h2 className="intro-eyebrow">{contact.title}</h2>
          <div className="intro-rows">
            {contact.items.map((item) =>
              item.href ? (
                <a
                  key={`${item.label}:${item.value}`}
                  className="intro-row intro-row-small"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="intro-row-label">{item.label}</span>
                  <span className="intro-row-value">{item.value}</span>
                  <span className="intro-row-hint intro-row-arrow" aria-hidden>
                    ↗
                  </span>
                </a>
              ) : (
                <button
                  key={`${item.label}:${item.value}`}
                  type="button"
                  className="intro-row"
                  onClick={() => copy(item.value)}
                >
                  <span className="intro-row-label">{item.label}</span>
                  <span className="intro-row-value">{item.value}</span>
                  <span className="intro-row-hint" data-copied={copiedValue === item.value}>
                    {copiedValue === item.value ? contact.copied : contact.copyHint}
                  </span>
                </button>
              ),
            )}
          </div>
          <p className="intro-welcome">{contact.welcome}</p>
          <p className="intro-bookmark">
            {contact.bookmarkBeforeKeys}
            {unsupportedMobile ? null : <span className="intro-kbd">{bookmarkShortcut()}</span>}
            {contact.bookmarkAfterKeys}
          </p>
        </section>

        <section className="intro-section intro-rise" style={riseStyle(4)}>
          <h2 className="intro-eyebrow">{notice.title}</h2>
          <p className="intro-warning">{notice.warning}</p>
          <p className="intro-advice intro-success">{notice.selfContained}</p>
          <p className="intro-advice">{notice.ai}</p>
          <p className="intro-advice">{notice.network}</p>
          <p className="intro-fine">{notice.fiction}</p>
        </section>

        {unsupportedMobile ? null : (
          <footer className="intro-footer intro-rise" style={riseStyle(5)}>
            <button type="button" className="intro-start" onClick={onStart}>
              {hero.start}
            </button>
            <p className="intro-note">{hero.note}</p>
          </footer>
        )}
      </main>
    </div>
  );
}
