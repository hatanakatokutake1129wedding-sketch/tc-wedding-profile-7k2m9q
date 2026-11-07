(function () {
  var C = window.CONTENT;

  /* 公開期限: 過ぎたら中身は一切表示しない(画像も読み込まない) */
  if (C.site.expires && Date.now() > new Date(C.site.expires + "T23:59:59+09:00").getTime()) {
    document.body.innerHTML = '<main class="closed"><p class="closed-title">Tasuku <i>&amp;</i> Chisato</p>' +
      '<p>このページの公開は終了しました。<br>ご覧いただき、ありがとうございました。</p></main>';
    return;
  }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /* 画像つきの枠。画像が読み込めない間は .ph の「PHOTO」仮枠が見える */
  function photo(src, alt, cls, pos) {
    var box = el("div", "ph" + (cls ? " " + cls : ""));
    if (src) {
      var img = new Image();
      img.alt = alt || "";
      img.decoding = "async";
      if (pos) img.style.objectPosition = pos;
      img.onload = function () { box.appendChild(img); };
      img.src = src;
    }
    return box;
  }

  /* 項目に添える写真(1〜2枚)。{src, ratio, pos, cap} の配列 */
  function shots(list) {
    if (!list || !list.length) return null;
    var wrap = el("div", "shots n" + list.length);
    list.forEach(function (s) {
      var fig = el("figure", "shot");
      var box = photo(s.src, s.cap || "", "", s.pos);
      box.style.aspectRatio = s.ratio || (list.length > 1 ? "1 / 1" : "4 / 3");
      fig.appendChild(box);
      if (s.cap) fig.appendChild(el("figcaption", "", s.cap));
      wrap.appendChild(fig);
    });
    return wrap;
  }

  /* ---- site ---- */
  $("#site-title").textContent = C.site.title;
  $("#hero-meta").innerHTML = C.site.date + "<br>" + C.site.venue;
  $("#footer-thanks").textContent = C.site.thanks;
  $("#footer-photo").replaceWith(photo(C.site.lastImage, "Tasuku & Chisato", "footer-photo reveal"));
  $("#hero-photo").replaceWith(photo(C.site.heroImage, "Tasuku & Chisato", "hero-photo"));

  /* ---- message modal ---- */
  var modal = $("#modal"), modalBody = $("#modal-body");
  function openModal(m) {
    $("#modal-label").textContent = m.label;
    modalBody.innerHTML = "";
    modalBody.appendChild(el("p", "", "")).textContent = m.text; // 画像の読み込み前/失敗時の表示
    var img = new Image();
    img.alt = m.label;
    img.onload = function () { modalBody.innerHTML = ""; modalBody.appendChild(img); };
    img.src = m.image;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  modal.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  /* ---- profile: 新郎の紹介 → メッセージ → 新婦の紹介 → メッセージ ---- */
  var pbody = $("#profile-body");
  C.profiles.forEach(function (p) {
    var wrap = el("div", "person");
    wrap.appendChild(el("p", "role reveal", p.role + "<span>" + p.roleJp + "</span>"));
    var card = el("div", "profile-card reveal");
    card.appendChild(photo(p.photo, p.name));
    card.appendChild(el("h3", "profile-name", p.name + "<small>" + p.nameEn + "</small>"));
    var ul = el("ul", "rows");
    p.rows.forEach(function (r) { ul.appendChild(el("li", "", "<span>" + r[0] + "</span><span>" + r[1] + "</span>")); });
    card.appendChild(ul);
    wrap.appendChild(card);
    var b = el("button", "letter reveal", "<b>" + p.message.label + "</b><em>タップして開く</em>");
    b.addEventListener("click", function () { openModal(p.message); });
    wrap.appendChild(b);
    pbody.appendChild(wrap);
  });

  /* ---- favorites ---- */
  var stack = $("#stack");
  C.favorites.forEach(function (f, i) {
    var c = el("article", "fav");
    c.dataset.tag = String(i + 1).padStart(2, "0") + " / " + f.tag;
    c.style.setProperty("--i", i);
    c.style.setProperty("--rot", (i % 2 ? .8 : -.8) + "deg");
    c.innerHTML = "<h3>" + f.title + "<small>by " + f.by + "</small></h3><p></p>";
    $("p", c).textContent = f.body;
    var fs = shots(f.photos);
    if (fs) c.insertBefore(fs, $("p", c));
    stack.appendChild(c);
  });

  /* ---- playlist ---- */
  var pl = C.playlist;
  $("#playlist-caption").innerHTML = pl.caption.split("\n").join("<br>");
  var pb = $("#playlist-body");
  pb.appendChild(el("h3", "pl-title", pl.title + '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'));
  if (pl.spotifyId) {
    /* Spotify公式の埋め込みプレイヤー(曲リスト付き) */
    var frame = el("iframe", "spotify");
    frame.src = "https://open.spotify.com/embed/playlist/" + pl.spotifyId + "?utm_source=generator" + (pl.spotifyTheme != null ? "&theme=" + pl.spotifyTheme : "");
    frame.title = pl.title;
    frame.height = 352;
    frame.loading = "lazy";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    pb.appendChild(frame);
  } else {
    var covers = el("div", "covers");
    for (var k = 0; k < 4; k++) covers.appendChild(photo((pl.covers || [])[k], "", ""));
    pb.insertBefore(covers, pb.firstChild);
    var tl = el("ol", "tracks");
    (pl.tracks || []).forEach(function (t, i) {
      tl.appendChild(el("li", "", '<span class="no">' + (i + 1) + "</span><div><b>" + t.title + "</b><small>" + t.artist + "</small></div>"));
    });
    pb.appendChild(tl);
  }
  var cta = el("a", "cta", pl.cta);
  cta.href = pl.url; cta.target = "_blank"; cta.rel = "noopener";
  pb.appendChild(cta);

  /* ---- Q&A accordion ---- */
  var qa = $("#qa-body");
  var chevron = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5l5 5 5-5"/></svg>';
  C.qa.forEach(function (x, i) {
    var item = el("div", "qa-item reveal");
    var q = el("button", "qa-q", "<span>" + x.q + "</span>" + chevron);
    q.setAttribute("aria-expanded", "false");
    var a = el("div", "qa-a", "<div><p></p></div>");
    $("p", a).textContent = x.a;
    var qs = shots(x.photos);
    if (qs) $("p", a).parentNode.insertBefore(qs, $("p", a));
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open);
    });
    item.appendChild(q); item.appendChild(a);
    qa.appendChild(item);
  });

  /* ---- menu ---- */
  var menu = $("#menu"), mbtn = $("#menu-btn");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    mbtn.setAttribute("aria-expanded", open);
    mbtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflow = open ? "hidden" : "";
  }
  mbtn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });

  /* ---- scroll reveal ---- */
  var targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }
})();
