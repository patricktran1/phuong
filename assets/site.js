const $ = (selector) => document.querySelector(selector);
const nav = $("#navigation");
const menu = $(".menu-toggle");
function closeMenu() {
  nav.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
}
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
});
matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);
nav
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    closeMenu();
    menu.focus();
  }
});
document.querySelectorAll("[data-interest]").forEach((control) =>
  control.addEventListener("click", () => {
    $("#interest").value = control.dataset.interest;
    $("#visit").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    $("#interest").focus({ preventScroll: true });
  }),
);
document.querySelectorAll("img[data-source]").forEach((img) => {
  const fallback = () => {
    img.hidden = true;
    const replacement = img.parentElement.querySelector(".image-fallback");
    if (replacement) replacement.hidden = false;
  };
  img.addEventListener("error", fallback);
  if (img.complete && !img.naturalWidth) fallback();
});
$("#year").textContent = String(new Date().getFullYear());
$("#inquiry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const d = new FormData(form);
  const name = String(d.get("name")).trim();
  const email = String(d.get("email")).trim();
  const message = String(d.get("message")).trim();
  if (!name || !message) {
    $("#form-status").textContent = "Please add your name and a short message.";
    return;
  }
  const interest = String(d.get("interest"));
  const body = `Hello Phuong Jewelry,\n\nMy name is ${name}. I’m interested in ${interest.toLowerCase()}.\n\n${message}\n\nYou can reach me at ${email}.\n\nThank you,\n${name}`;
  $("#email-link").href =
    `mailto:phuongjewelry@gmail.com?subject=${encodeURIComponent("Jewelry inquiry: " + interest)}&body=${encodeURIComponent(body)}`;
  $("#email-draft").value = body;
  $("#form-result").hidden = false;
  $("#form-status").textContent =
    "Draft prepared. Your message has not been sent.";
  $("#email-link").focus({ preventScroll: true });
});
$("#copy-draft").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText($("#email-draft").value);
    $("#form-status").textContent =
      "Message copied. Paste it into your email app to send.";
  } catch {
    $("#email-draft").focus();
    $("#email-draft").select();
    $("#form-status").textContent =
      "Message selected. Use your device’s Copy command.";
  }
});
document.querySelectorAll("[data-dialog]").forEach((button) =>
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.dialog);
    dialog.showModal();
    document.body.classList.add("modal-open");
  }),
);
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () =>
    document.body.classList.remove("modal-open"),
  );
  dialog.addEventListener("click", (event) => {
    const r = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom)
    )
      dialog.close();
  });
});
function safeGoogleLink(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      (u.hostname === "google.com" ||
        u.hostname.endsWith(".google.com") ||
        u.hostname === "maps.app.goo.gl")
      ? u.href
      : null;
  } catch {
    return null;
  }
}
async function enableGoogle() {
  try {
    const res = await fetch("./api/google-reviews", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.configured) $("#google-live").hidden = false;
  } catch {
    /* External review links remain usable on static hosts. */
  }
}
let loadedGoogleReviews = [];
function externalLink(text, value) {
  const link = document.createElement("a");
  link.textContent = text;
  const url = safeGoogleLink(value);
  if (url) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  return link;
}
function googleAttribution() {
  const mark = document.createElement("span");
  mark.textContent = "Google Maps";
  mark.setAttribute("translate", "no");
  mark.className = "gmp-attribution";
  return mark;
}
function googleAvatar(url, name) {
  try {
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      !(
        u.hostname.endsWith(".googleusercontent.com") ||
        u.hostname.endsWith(".ggpht.com")
      )
    )
      return null;
    const avatar = document.createElement("img");
    avatar.src = u.href;
    avatar.alt = "Profile photo of " + name;
    avatar.width = 36;
    avatar.height = 36;
    avatar.loading = "lazy";
    avatar.className = "google-avatar";
    avatar.referrerPolicy = "no-referrer";
    avatar.addEventListener("error", () => avatar.remove());
    return avatar;
  } catch {
    return null;
  }
}
function renderGoogleReviews() {
  const onlyFive = $("#five-star-only").checked;
  const reviews = loadedGoogleReviews.filter(
    (review) => !onlyFive || review.rating === 5,
  );
  const list = $("#google-reviews");
  list.replaceChildren();
  $("#google-filter-note").textContent = onlyFive
    ? "Showing only five-star reviews from Google’s relevance-selected results. This selection is not the overall rating."
    : "Excerpts from reviews selected and ordered by Google for relevance.";
  reviews.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card";
    const quote = document.createElement("blockquote");
    quote.textContent = review.text;
    const author = document.createElement("div");
    author.className = "google-author";
    const avatar = googleAvatar(review.avatarUrl, review.author);
    if (avatar) author.append(avatar);
    author.append(externalLink(review.author, review.authorUrl));
    const detail = document.createElement("small");
    detail.textContent = `${review.rating}/5 · ${review.date || "Date unavailable"}`;
    card.append(
      quote,
      author,
      detail,
      externalLink("Read full review on Google Maps ↗", review.url),
      googleAttribution(),
    );
    list.append(card);
  });
  if (!reviews.length) {
    const empty = document.createElement("p");
    empty.textContent = onlyFive
      ? "No five-star text reviews were included in these Google results. View all returned reviews or read more on Google Maps."
      : "Google returned no text reviews. Read more on Google Maps.";
    list.append(empty);
  }
}
$("#five-star-only").addEventListener("change", renderGoogleReviews);
$("#load-google").addEventListener("click", async () => {
  const button = $("#load-google");
  button.disabled = true;
  $("#google-status").textContent =
    "Loading reviews and photos from Google Maps…";
  try {
    const res = await fetch("./api/google-reviews?load=1");
    if (!res.ok) throw new Error("Reviews unavailable");
    const data = await res.json();
    if (!data.configured || !Array.isArray(data.reviews))
      throw new Error("Reviews unavailable");
    loadedGoogleReviews = data.reviews;
    renderGoogleReviews();
    $("#google-filter").hidden = false;
    $("#google-status").textContent =
      `Google Maps · Overall rating: ${data.rating}/5 from ${data.count} reviews.`;
    const gallery = $("#google-photos");
    gallery.replaceChildren();
    (data.photos || []).forEach((photo) => {
      let url;
      try {
        url = new URL(photo.imageUrl);
      } catch {
        return;
      }
      if (
        url.protocol !== "https:" ||
        !url.hostname.endsWith(".googleusercontent.com")
      )
        return;
      const figure = document.createElement("figure");
      const img = document.createElement("img");
      img.src = url.href;
      img.alt = "Photograph from Phuong Jewelry’s Google Maps listing";
      img.className = "google-photo";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => figure.remove());
      const caption = document.createElement("figcaption");
      photo.authors.forEach((person) => {
        const by = document.createElement("div");
        by.className = "google-author";
        const avatar = googleAvatar(person.avatarUrl, person.name);
        if (avatar) by.append(avatar);
        by.append(externalLink("Photo by " + person.name, person.url));
        caption.append(by);
      });
      caption.append(
        externalLink("View source photo on Google Maps ↗", photo.url),
        googleAttribution(),
      );
      figure.append(img, caption);
      gallery.append(figure);
    });
    button.hidden = true;
  } catch {
    $("#google-status").textContent =
      "Google content could not be loaded. Please try again or use the Google Maps link above.";
  } finally {
    button.disabled = false;
  }
});
if (location.protocol === "http:" || location.protocol === "https:")
  enableGoogle();
