window.__ModuleLoader__.load({
  id: "dsh-session-robustness",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");

    const inject = ["slots"];
    const PLUGIN = "dsh-session-robustness";
    const VERSION = "0.1.6";

    const NETWORK_LABELS = [
      ["TIMEOUT", "Timeout"],
      ["TRANSPORT", "Transport / Disconnect (includes fetch failed)"],
      ["RATE_LIMIT", "Rate limit 429"],
      ["SERVER", "Server 5xx"],
      ["EMPTY_RESPONSE", "Empty response"],
      ["STREAM_CLOSED", "SSE stream closed"],
      ["MALFORMED_RESPONSE", "Malformed SSE"],
      ["STREAM", "Stream failure"],
      ["stream_read_error", "Stream read error (adapter native code)"],
      ["HTTP_408+", "HTTP 408 / 409 / 425 / 429 / 499 / 5xx"]
    ];
    const NEVER_LABELS = [
      ["AUTH", "Authentication failed"],
      ["QUOTA", "Quota exhausted"],
      ["CONTEXT_WINDOW_EXCEEDED", "Context exceeded (handed to compaction)"],
      ["ABORTED", "You clicked stop"],
      ["MISSING_CREDENTIAL", "Missing secret key"],
      ["NO_ADAPTER", "No model adapter available"]
    ];

    function parseBody(res) {
      return res.text().then((text) => {
        const trimmed = String(text || "").trim();
        if (!trimmed) {
          throw new Error("Host half not mounted (empty response HTTP " + res.status + "). This process was started before installation: this page will work after restarting dsh web.");
        }
        try {
          return JSON.parse(trimmed);
        } catch (err) {
          throw new Error("Host returned non-JSON (HTTP " + res.status + "). If you just installed the plugin, please restart dsh web.");
        }
      });
    }

    function callHost(method, args) {
      return fetch("/session-robustness/api/" + method, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args || {}),
        credentials: "same-origin"
      }).then((res) => parseBody(res).then((body) => {
        if (!res.ok || (body && body.ok === false)) {
          throw new Error((body && (body.error || body.note)) || ("HTTP " + res.status));
        }
        return body;
      }));
    }

    function insertStyles(css) {
      if (typeof document === "undefined") return () => {};
      const tagId = PLUGIN + "/styles";
      if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return () => {};
      const tag = document.createElement("style");
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
      return () => { try { if (tag.parentNode) tag.parentNode.removeChild(tag); } catch {} };
    }

    const CSS =
      ".sr-root{display:flex;flex-direction:column;gap:16px;padding:2px 2px 28px;font-size:13px;color:var(--dsw-alias-label-primary);line-height:1.45}" +
      ".sr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}" +
      ".sr-title{display:flex;flex-direction:column;gap:2px}" +
      ".sr-name{font-weight:600;font-size:15px}" +
      ".sr-muted{color:var(--dsw-alias-label-secondary);font-size:12px}" +
      ".sr-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}" +
      ".sr-btn{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer}" +
      ".sr-btn:hover{border-color:var(--dsw-alias-brand-primary)}" +
      ".sr-btn:disabled{opacity:.5;cursor:not-allowed}" +
      ".sr-btn.primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-on-brand, #fff)}" +
      ".sr-btn.danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}" +
      ".sr-msg{padding:8px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:12px;white-space:pre-wrap}" +
      ".sr-msg.error{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}" +
      ".sr-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}" +
      ".sr-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
      ".sr-field{display:flex;flex-direction:column;gap:4px}" +
      ".sr-field label{font-size:11px;color:var(--dsw-alias-label-secondary)}" +
      ".sr-field input,.sr-field textarea{background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);border-radius:6px;padding:6px 8px;font-size:12px}" +
      ".sr-chip{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:2px 8px;font-size:11px;color:var(--dsw-alias-label-secondary)}" +
      ".sr-chip.ok{color:var(--dsw-alias-state-success-primary, var(--dsw-alias-brand-primary));border-color:currentColor}" +
      ".sr-chip.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}" +
      ".sr-chip.bad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}" +
      ".sr-status{display:flex;align-items:center;gap:10px}" +
      ".sr-dot{width:10px;height:10px;border-radius:99px;background:var(--dsw-alias-brand-primary);flex:0 0 auto}" +
      ".sr-dot.warn{background:var(--dsw-alias-state-warn-primary)}" +
      ".sr-dot.off{background:var(--dsw-alias-label-secondary)}" +
      ".sr-status-copy{display:flex;flex-direction:column;gap:2px}" +
      ".sr-status-title{font-weight:600;font-size:14px}" +
      ".sr-steps{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}" +
      ".sr-step{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start}" +
      ".sr-n{width:22px;height:22px;border-radius:99px;border:1px solid var(--dsw-alias-border-l1);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dsw-alias-label-secondary)}" +
      ".sr-live{display:flex;flex-direction:column;gap:8px}" +
      ".sr-live-row{padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:4px}" +
      ".sr-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}" +
      ".sr-item{display:flex;flex-direction:column;gap:1px;padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}" +
      ".sr-item:last-child{border-bottom:none}" +
      ".sr-code{font-family:ui-monospace,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-secondary)}" +
      ".sr-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
      ".sr-dock{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:12px;color:var(--dsw-alias-label-primary)}" +
      ".sr-pulse{width:8px;height:8px;border-radius:99px;background:var(--dsw-alias-state-warn-primary)}" +
      "@media (max-width:640px){.sr-cols,.sr-grid{grid-template-columns:1fr}}";

    function formatDelay(ms) {
      if (!Number.isFinite(ms)) return "?";
      if (ms < 1000) return Math.round(ms) + "ms";
      return (ms / 1000).toFixed(1) + "s";
    }

    function remainMs(row) {
      const nextAt = row && Number(row.nextAt);
      if (!Number.isFinite(nextAt) || nextAt <= 0) return Number(row && row.delayMs) || 0;
      return Math.max(0, nextAt - Date.now());
    }

    function statusView(cfg) {
      if (cfg.enabled === false) {
        return { title: "Disabled", detail: "Transient API failures will end the turn after official 5 retries.", dot: "off", chip: "Disabled", chipClass: "bad" };
      }
      if (cfg.paused) {
        return { title: "Paused", detail: "New failures will not take over; in-flight backoff has been aborted. Click enable to resume.", dot: "warn", chip: "Paused", chipClass: "warn" };
      }
      const cap = (cfg.maxRetries || 0) === 0 ? "Unlimited retries after official 5" : ("Up to " + cfg.maxRetries + " additional attempts after official 5");
      return { title: "Running", detail: cap + ". Parent session and in-process child agents will both take over.", dot: "", chip: "Enabled", chipClass: "ok" };
    }

    function RobustnessSettings() {
      const [data, setData] = react.useState(null);
      const [busy, setBusy] = react.useState("");
      const [msg, setMsg] = react.useState("");
      const [err, setErr] = react.useState("");
      const [form, setForm] = react.useState(null);

      const refresh = react.useCallback(() => {
        return callHost("status", {}).then(
          (r) => {
            setData(r);
            setErr("");
            const c = r.config || {};
            setForm((prev) => prev || {
              extraRetryableCodes: (c.extraRetryableCodes || []).join(", "),
              initialDelayMs: String(c.initialDelayMs ?? 1000),
              maxDelayMs: String(c.maxDelayMs ?? 30000),
              jitterRatio: String(c.jitterRatio ?? 0.2),
              maxRetries: String(c.maxRetries ?? 0)
            });
            return r;
          },
          (e) => { setErr("加载失败: " + String(e && e.message || e)); }
        );
      }, []);

      react.useEffect(() => { refresh(); }, [refresh]);
      react.useEffect(() => {
        const id = setInterval(() => { refresh(); }, 1500);
        return () => clearInterval(id);
      }, [refresh]);

      const run = (label, p) => {
        setBusy(label);
        setMsg("");
        setErr("");
        return Promise.resolve(p).then(
          (r) => { if (r && r.note) setMsg(String(r.note)); return refresh(); },
          (e) => setErr(label + " 失败: " + String(e && e.message || e))
        ).finally(() => setBusy(""));
      };

      const cfg = data && data.config ? data.config : {};
      const active = data && Array.isArray(data.active) ? data.active : [];
      const st = statusView(cfg);
      const extras = (cfg.extraRetryableCodes || []).filter(Boolean);

      const elems = [
        react.createElement("div", { key: "head", className: "sr-head" },
          react.createElement("div", { className: "sr-title" },
            react.createElement("span", { className: "sr-name" }, "Session Robustness"),
            react.createElement("span", { className: "sr-muted" }, "Don't end session due to network failures · v" + VERSION)
          )
        )
      ];

      if (err) elems.push(react.createElement("div", { key: "err", className: "sr-msg error" }, err));
      if (msg) elems.push(react.createElement("div", { key: "msg", className: "sr-msg" }, msg));
      if (busy) elems.push(react.createElement("div", { key: "busy", className: "sr-msg" }, busy + " …"));

      elems.push(react.createElement("div", { key: "state", className: "sr-card" },
        react.createElement("div", { className: "sr-status" },
          react.createElement("span", { className: "sr-dot" + (st.dot ? " " + st.dot : "") }),
          react.createElement("div", { className: "sr-status-copy" },
            react.createElement("div", { className: "sr-status-title" }, st.title),
            react.createElement("div", { className: "sr-muted" }, st.detail)
          )
        ),
        react.createElement("div", { className: "sr-row" },
          react.createElement("span", { className: "sr-chip " + st.chipClass }, st.chip),
          react.createElement("span", { className: "sr-chip" }, (cfg.maxRetries || 0) === 0 ? "无次数上限" : ("接管后最多 " + cfg.maxRetries + " 次")),
          react.createElement("span", { className: "sr-chip" }, "退避 " + formatDelay(cfg.initialDelayMs || 1000) + " → " + formatDelay(cfg.maxDelayMs || 30000))
        ),
        react.createElement("div", { className: "sr-row" },
          react.createElement("button", {
            className: "sr-btn" + (cfg.enabled !== false && !cfg.paused ? "" : " primary"),
            disabled: !!busy || (cfg.enabled !== false && !cfg.paused),
            onClick: () => run("Enable", callHost("resume", {}))
          }, "Enable"),
          react.createElement("button", {
            className: "sr-btn",
            disabled: !!busy || cfg.enabled === false || cfg.paused,
            onClick: () => run("Pause", callHost("pause", {}))
          }, "Pause Takeover"),
          react.createElement("button", {
            className: "sr-btn danger",
            disabled: !!busy || cfg.enabled === false,
            onClick: () => run("Disable", callHost("update", { enabled: false }))
          }, "Disable")
        )
      ));

      elems.push(react.createElement("div", { key: "how", className: "sr-card" },
        react.createElement("div", { className: "sr-name" }, "What You Will See In Chat"),
        react.createElement("ol", { className: "sr-steps" },
          react.createElement("li", { className: "sr-step" },
            react.createElement("span", { className: "sr-n" }, "1"),
            react.createElement("div", null,
              react.createElement("div", null, "Official retries first, up to 5 times"),
              react.createElement("div", { className: "sr-hint" }, "Text says \"Retried model request (n/5)\". This plugin hasn't taken over yet.")
            )
          ),
          react.createElement("li", { className: "sr-step" },
            react.createElement("span", { className: "sr-n" }, "2"),
            react.createElement("div", null,
              react.createElement("div", null, "After 5/5 this plugin takes over, continuing same request"),
              react.createElement("div", { className: "sr-hint" }, "Above composer you'll see \"Transient API failure, attempt N\". Official count stops increasing.")
            )
          ),
          react.createElement("li", { className: "sr-step" },
            react.createElement("span", { className: "sr-n" }, "3"),
            react.createElement("div", null,
              react.createElement("div", null, "Success, you click stop, or pause here, which will end"),
              react.createElement("div", { className: "sr-hint" }, "Authentication failures, quota exhaustion, context overflow are not retried to avoid wasting resources.")
            )
          )
        )
      ));

      if (active.length > 0) {
        elems.push(react.createElement("div", { key: "live", className: "sr-card" },
          react.createElement("div", { className: "sr-row" },
            react.createElement("span", { className: "sr-name" }, "Taking Over"),
            react.createElement("span", { className: "sr-chip warn" }, active.length + " active")
          ),
          react.createElement("div", { className: "sr-live" },
            active.map((row) => react.createElement("div", { key: String(row.sessionId) + ":" + row.turn + ":" + row.step, className: "sr-live-row" },
              react.createElement("div", { className: "sr-row" },
                react.createElement("span", { className: "sr-chip warn" }, "Attempt " + row.attempt),
                react.createElement("span", { className: "sr-chip" }, row.provider || "?"),
                react.createElement("span", { className: "sr-chip" }, row.code || ""),
                react.createElement("span", { className: "sr-muted" }, "Remaining " + formatDelay(remainMs(row)))
              ),
              row.message ? react.createElement("div", { className: "sr-muted" }, String(row.message).slice(0, 220)) : null,
              row.codexDrop && row.codexDrop.dropped ? react.createElement("div", { className: "sr-muted" }, "已丢弃 Codex WebSocket 续写，下次全量请求") : null
            ))
          )
        ));
      }

      elems.push(react.createElement("div", { key: "cover", className: "sr-card" },
        react.createElement("div", { className: "sr-name" }, "Coverage"),
        react.createElement("div", { className: "sr-cols" },
          react.createElement("div", null,
            react.createElement("div", { className: "sr-muted" }, "Will retry indefinitely (network failures)"),
            NETWORK_LABELS.map((pair) => react.createElement("div", { key: pair[0], className: "sr-item" },
              react.createElement("span", null, pair[1]),
              react.createElement("span", { className: "sr-code" }, pair[0])
            )),
            react.createElement("div", { className: "sr-item" },
              react.createElement("span", null, "Codex overloaded / Upstream request failed and similar fallback wording"),
              react.createElement("span", { className: "sr-code" }, "PI_AI_ERROR / UNKNOWN + transient wording")
            ),
            react.createElement("div", { className: "sr-item" },
              react.createElement("span", null, "After openai-codex failure, drop WebSocket continuation, full request next round"),
              react.createElement("span", { className: "sr-code" }, "previous_response_id")
            )
          ),
          react.createElement("div", null,
            react.createElement("div", { className: "sr-muted" }, "Will not retry"),
            NEVER_LABELS.map((pair) => react.createElement("div", { key: pair[0], className: "sr-item" },
              react.createElement("span", null, pair[1]),
              react.createElement("span", { className: "sr-code" }, pair[0])
            )),
            react.createElement("div", { className: "sr-item" },
              react.createElement("span", null, "Bad request / Content filter"),
              react.createElement("span", { className: "sr-code" }, "INVALID_REQUEST / HTTP_400 / CONTENT_FILTER")
            )
          )
        )
      ));

      if (form) {
        elems.push(react.createElement("div", { key: "form", className: "sr-card" },
          react.createElement("div", { className: "sr-name" }, "Retries After Takeover"),
          react.createElement("div", { className: "sr-hint" }, "These are parameters after the official 5 retries. Retry limit 0 = keep retrying until success or you cancel."),
          react.createElement("div", { className: "sr-grid" },
            react.createElement("div", { className: "sr-field" },
              react.createElement("label", null, "Initial delay (ms)"),
              react.createElement("input", { value: form.initialDelayMs, onChange: (e) => setForm(Object.assign({}, form, { initialDelayMs: e.target.value })) }),
              react.createElement("span", { className: "sr-hint" }, "How long to wait on first takeover")
            ),
            react.createElement("div", { className: "sr-field" },
              react.createElement("label", null, "Maximum delay (ms)"),
              react.createElement("input", { value: form.maxDelayMs, onChange: (e) => setForm(Object.assign({}, form, { maxDelayMs: e.target.value })) }),
              react.createElement("span", { className: "sr-hint" }, "Exponential backoff upper limit, default 30s")
            ),
            react.createElement("div", { className: "sr-field" },
              react.createElement("label", null, "Jitter 0–1"),
              react.createElement("input", { value: form.jitterRatio, onChange: (e) => setForm(Object.assign({}, form, { jitterRatio: e.target.value })) }),
              react.createElement("span", { className: "sr-hint" }, "Avoid flooding gateway with multiple sessions at once")
            ),
            react.createElement("div", { className: "sr-field" },
              react.createElement("label", null, "Retry limit (0 = unlimited)"),
              react.createElement("input", { value: form.maxRetries, onChange: (e) => setForm(Object.assign({}, form, { maxRetries: e.target.value })) }),
              react.createElement("span", { className: "sr-hint" }, "Only limits this plugin, not including the official 5")
            )
          ),
          react.createElement("div", { className: "sr-field" },
            react.createElement("label", null, "Additional retryable codes (comma separated)"),
            react.createElement("input", {
              value: form.extraRetryableCodes,
              placeholder: "Usually not needed. AUTH / QUOTA will still be rejected",
              onChange: (e) => setForm(Object.assign({}, form, { extraRetryableCodes: e.target.value }))
            })
          ),
          extras.length ? react.createElement("div", { className: "sr-row" }, extras.map((c) => react.createElement("span", { key: c, className: "sr-chip" }, c))) : null,
          react.createElement("div", { className: "sr-row" },
            react.createElement("button", {
              className: "sr-btn primary",
              disabled: !!busy,
              onClick: () => run("Save", callHost("update", {
                extraRetryableCodes: form.extraRetryableCodes.split(/[,\s]+/).filter(Boolean),
                initialDelayMs: Number(form.initialDelayMs),
                maxDelayMs: Number(form.maxDelayMs),
                jitterRatio: Number(form.jitterRatio),
                maxRetries: Number(form.maxRetries)
              }))
            }, "Save")
          )
        ));
      }

      return react.createElement("div", { className: "sr-root" }, elems);
    }

    function RetryDock(props) {
      const sessionId = props && props.sessionId ? String(props.sessionId) : "";
      const [row, setRow] = react.useState(null);
      react.useEffect(() => {
        let cancelled = false;
        const tick = () => {
          callHost("status", {}).then(
            (r) => {
              if (cancelled) return;
              const list = r && Array.isArray(r.active) ? r.active : [];
              const hit = sessionId ? list.find((x) => x.sessionId === sessionId) : list[0];
              setRow(hit || null);
            },
            () => { if (!cancelled) setRow(null); }
          );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => { cancelled = true; clearInterval(id); };
      }, [sessionId]);
      if (!row) return null;
      return react.createElement("div", { className: "sr-dock" },
        react.createElement("span", { className: "sr-pulse" }),
        react.createElement("span", null, "Official 5 retries exhausted, taking over for attempt " + row.attempt),
        react.createElement("span", { className: "sr-muted" }, (row.code || "") + " · Remaining " + formatDelay(remainMs(row))),
        react.createElement("button", { className: "sr-btn danger", onClick: () => callHost("pause", {}).then(() => setRow(null)) }, "Pause Takeover")
      );
    }

    function apply(ctx) {
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      const disposeStyles = insertStyles(CSS);
      ctx.effect(() => disposeStyles);
      slots.inject("settings.section", () => slots.register(
        { name: "settings.section", id: "session-robustness", order: 13, label: () => "Session Robustness" },
        RobustnessSettings
      ));
      slots.inject("conversation.input.dock", () => slots.register(
        { name: "conversation.input.dock", id: "session-robustness", order: 5, label: () => "Session Robustness" },
        RetryDock
      ));
    }

    module.exports = { inject, apply, PLUGIN, VERSION };
    return module.exports;
  }
});
