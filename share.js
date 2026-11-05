(function () {
  const W = 1080;
  const H = 1350;
  const SANS = "'DM Sans','Noto Serif SC',serif";
  const SERIF = "'Noto Serif SC',Georgia,serif";
  const LATIN = "Georgia,'Noto Serif SC',serif";
  let getState = null;
  let helpers = null;
  let lastBlob = null;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = Array.from(text);
    let line = "";
    let lines = [];
    chars.forEach((ch) => {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
    }
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
    return lines.length;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function build() {
    const { m, d, match } = getState();
    const w = match.work;
    const zh = helpers.isZh();
    const t = helpers.t;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#f7f6ef");
    bg.addColorStop(0.55, "#eef2ec");
    bg.addColorStop(1, "#dde8e4");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(33,77,105,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    ctx.fillStyle = "#8d7659";
    ctx.font = "300 26px " + SANS;
    ctx.fillText("PORCELAIN TIME", 96, 132);
    ctx.textAlign = "right";
    ctx.font = (zh ? "300 26px " + SERIF : "300 26px " + SANS);
    ctx.fillText(zh ? "瓷时 · 生日陶瓷" : "A BIRTHDAY IN PORCELAIN", W - 96, 132);
    ctx.textAlign = "left";

    const frameX = 96, frameW = W - 192, frameY = 170;
    const img = await loadImage(w.image);
    let iw = 0, ih = 0;
    if (img) {
      const ratio = Math.min((frameW - 150) / img.width, 520 / img.height);
      iw = img.width * ratio;
      ih = img.height * ratio;
    }
    const frameH = Math.max(ih + 86, 300);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    roundRect(ctx, frameX, frameY, frameW, frameH, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(33,77,105,0.14)";
    ctx.stroke();

    if (img) {
      ctx.save();
      ctx.shadowColor = "rgba(25,60,80,0.22)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 22;
      ctx.drawImage(img, frameX + (frameW - iw) / 2, frameY + (frameH - ih) / 2, iw, ih);
      ctx.restore();
    }

    let y = frameY + frameH + 66;
    ctx.fillStyle = "#adc8c7";
    ctx.font = "400 92px " + LATIN;
    ctx.fillText(helpers.pad(m) + "." + helpers.pad(d), 96, y);

    y += 66;
    ctx.fillStyle = "#203e50";
    ctx.font = (zh ? "500 54px " + SERIF : "400 46px " + LATIN);
    y += wrap(ctx, zh ? w.nameZh : w.nameEn, 96, y, W - 192, 66, 2) * 66;
    ctx.fillStyle = "#6f8a91";
    ctx.font = "italic 26px " + LATIN;
    ctx.fillText(zh ? w.nameEn : w.nameZh, 96, y + 4);

    y += 62;
    ctx.fillStyle = "#8d7659";
    ctx.font = "300 22px " + SERIF;
    ctx.fillText((zh ? w.dynastyZh + " · " + w.dateZh : w.dynastyEn + " · " + w.dateEn).toUpperCase(), 96, y);

    y += 46;
    ctx.strokeStyle = "rgba(33,77,105,0.22)";
    ctx.beginPath();
    ctx.moveTo(96, y);
    ctx.lineTo(W - 96, y);
    ctx.stroke();

    y += 56;
    ctx.fillStyle = "#3f5b64";
    ctx.font = (zh ? "300 30px " + SERIF : "400 28px " + LATIN);
    wrap(ctx, zh ? w.motifZh : w.motifEn, 96, y, W - 192, 46, 1);

    y += 62;
    ctx.fillStyle = "#214d69";
    ctx.font = "300 22px " + SERIF;
    ctx.fillText((zh ? "日期关联 · " : "MATCH · ") + t("tag." + match.mode), 96, y);

    ctx.fillStyle = "rgba(33,77,105,0.45)";
    ctx.font = "300 19px " + SANS;
    ctx.fillText(w.credit, 96, H - 96);
    ctx.textAlign = "right";
    ctx.font = (zh ? "300 19px " + SERIF : "300 19px " + SANS);
    ctx.fillText(zh ? "瓷时 · Porcelain Time" : "Porcelain Time", W - 96, H - 96);
    ctx.textAlign = "left";

    return canvas;
  }

  function toBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.94));
  }

  async function onShare() {
    const { m, d, match } = getState();
    const w = match.work;
    const t = helpers.t;
    const zh = helpers.isZh();
    const md = (zh ? m + " 月 " + d + " 日" : helpers.pad(m) + "." + helpers.pad(d));
    const shareText = t("share.text", {
      md, name: zh ? w.nameZh : w.nameEn,
      period: zh ? w.dateZh : w.dateEn,
      kiln: zh ? w.kilnZh : w.kilnEn,
      tag: t("tag." + match.mode)
    });
    const url = location.origin + location.pathname + "#/" + helpers.pad(m) + "-" + helpers.pad(d);

    try {
      if (!lastBlob) lastBlob = await toBlob(await build());
      const file = new File([lastBlob], "porcelain-time-" + helpers.pad(m) + helpers.pad(d) + ".png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: t("share.title"), text: shareText, url });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: t("share.title"), text: shareText, url });
        return;
      }
      throw new Error("no share");
    } catch (err) {
      if (err && err.name === "AbortError") return;
      try {
        if (!lastBlob) lastBlob = await toBlob(await build());
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": lastBlob })]);
          try { await navigator.clipboard.writeText(shareText + " " + url); } catch (e) {}
          helpers.showToast(t("share.copied"));
          return;
        }
      } catch (e) {}
      try {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(lastBlob || (await toBlob(await build())));
        a.download = "porcelain-time-" + helpers.pad(m) + helpers.pad(d) + ".png";
        a.click();
        helpers.showToast(t("share.downloaded"));
      } catch (e) {
        helpers.showToast(t("share.fallback"));
      }
    }
  }

  window.ShareCard = {
    init(stateFn, h) {
      getState = stateFn;
      helpers = h;
      document.getElementById("share").addEventListener("click", onShare);
    },
    refreshLabels() { lastBlob = null; },
    preview() { return build(); }
  };
})();
