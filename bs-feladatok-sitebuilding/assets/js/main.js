const navbar = document.querySelector('.navbar');
const navbarBrand = document.querySelector('.navbar-brand');
const navbarNavLinks = document.querySelectorAll('#navbarNav a');
let scrolled = false;
const links = document.querySelectorAll(".navbar-collapse ul a");
window.onscroll = NavbarOnScroll;

const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

for (const link of links) {
  link.addEventListener("click", clickHandlerOfNavbarLinks);
}

const NavbarOnScroll = (e) => {
  if (!scrolled && scrollY > 1) {
    navbar.classList.toggle('navbar-bg-initial');
    navbar.classList.toggle('navbar-bg-scrolled');
    navbarBrand.classList.toggle('navbar-brand-initial');
    navbarBrand.classList.toggle('navbar-brand-scrolled');
    for (link of navbarNavLinks) {
      link.classList.toggle('navbar-link-initial');
      link.classList.toggle('navbar-link-scrolled');
    }
    scrolled = true;
    return;
  }
  if (scrollY === 0) {
    navbar.classList.toggle('navbar-bg-initial');
    navbar.classList.toggle('navbar-bg-scrolled');
    navbarBrand.classList.toggle('navbar-brand-initial');
    navbarBrand.classList.toggle('navbar-brand-scrolled');
    for (link of navbarNavLinks) {
      link.classList.toggle('navbar-link-initial');
      link.classList.toggle('navbar-link-scrolled');
    }
    scrolled = false;
  }
}

const clickHandlerOfNavbarLinks = (e) => {
  e.preventDefault();
  const href = this.getAttribute("href");
  document.documentElement.style.scrollBehavior = "auto";
  animScroll(href);
}

const animScroll = (target, time = 300) => {
  const elem = document.querySelector(target);
  if (!elem) return;
  const to = elem.offsetTop;
  const from = window.scrollY;
  const start = new Date().getTime();
  const timer = setInterval(function () {
    const step = Math.min(1, (new Date().getTime() - start) / time);
    window.scrollTo(0, (from + step * (to - from)) + 1);
    if (step == 1) {
      clearInterval(timer);
      document.documentElement.style.scrollBehavior = "";
    }
  }, 25);
  window.scrollTo(0, (from + 1)); // ??
}


$("footer a").on("click", function (e) {
  e.preventDefault();
  let target = $(this).data("target");
  let modal = new bootstrap.Modal(target);

  modal.toggle();
});