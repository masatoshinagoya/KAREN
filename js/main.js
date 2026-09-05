(function () {
  "use strict";

  /* --- 固定電話番号・LINE予約URL（本番差し替え用の設定値） ---
     電話番号はtel:リンク用にハイフン無しの数字のみで指定する。
     LINE_URLは公式アカウントの友だち追加/予約URLに差し替える。 */
  var CONTACT_PHONE = "07090965078";
  var LINE_URL = "#"; // TODO: 本番のLINE予約URLに差し替え

  var telLink = document.querySelector('[data-contact="tel"]');
  if (telLink) telLink.href = "tel:" + CONTACT_PHONE;

  var lineLink = document.querySelector('[data-contact="line"]');
  if (lineLink) lineLink.href = LINE_URL;

  /* --- モバイルナビ開閉 --- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("global-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!isOpen));
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  /* --- フェードスライドショー（ヒーロー / スライドバナー共通） --- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var INTERVAL_MS = 6000;

  var initFadeSlideshow = function (slides) {
    if (slides.length < 2 || reduceMotion) return;

    var current = 0;
    setInterval(function () {
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, INTERVAL_MS);
  };

  initFadeSlideshow(document.querySelectorAll(".hero__slide"));

  /* --- イントロバナー（PC:ドラッグ / スマホ:フリックでスライド） --- */
  var bannerSlider = document.querySelector("[data-banner-slider]");
  var bannerSlides = document.querySelectorAll(".intro-banner__slide");
  var bannerDots = document.querySelectorAll("[data-banner-dots] button");

  if (bannerSlider && bannerSlides.length > 1) {
    var bannerCurrent = 0;
    var DRAG_THRESHOLD = 40;
    var pointerStartX = 0;
    var pointerStartY = 0;

    var goToBannerSlide = function (index) {
      bannerCurrent = (index + bannerSlides.length) % bannerSlides.length;
      bannerSlides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === bannerCurrent);
      });
      bannerDots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === bannerCurrent);
      });
    };

    bannerSlider.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    bannerSlider.addEventListener("pointerdown", function (e) {
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    });

    bannerSlider.addEventListener("pointerup", function (e) {
      var deltaX = e.clientX - pointerStartX;
      var deltaY = e.clientY - pointerStartY;

      // PC（マウスドラッグ）・スマホ（フリック）共通：一定量動かしたときだけスライドを切り替える
      if (Math.abs(deltaX) >= DRAG_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        goToBannerSlide(bannerCurrent + (deltaX < 0 ? 1 : -1));
      }
    });

    bannerSlider.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToBannerSlide(bannerCurrent + 1);
      }
    });
    bannerDots.forEach(function (dot, i) {
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        goToBannerSlide(i);
      });
    });
  }

  /* --- スクロール演出（ポップイン・スライドイン） --- */
  var animTargets = document.querySelectorAll(".c-anim-popin, .c-anim-slidein");

  if (animTargets.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      animTargets.forEach(function (el) {
        el.classList.add("is-animated");
      });
    } else {
      var animObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-animated");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

      animTargets.forEach(function (el) {
        animObserver.observe(el);
      });
    }
  }

  /* --- セラピストカード内 写真スライダー（1人3枚） --- */
  document.querySelectorAll("[data-photo-slider]").forEach(function (slider) {
    var track = slider.querySelector(".therapist-photo__track");
    var slideCount = slider.querySelectorAll(".therapist-photo__slide").length;
    var dots = slider.querySelectorAll("[data-photo-dots] button");
    var prev = slider.querySelector("[data-photo-prev]");
    var next = slider.querySelector("[data-photo-next]");
    var index = 0;

    var render = function () {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    };

    var goTo = function (i) {
      index = (i + slideCount) % slideCount;
      render();
    };

    if (prev) prev.addEventListener("click", function () { goTo(index - 1); });
    if (next) next.addEventListener("click", function () { goTo(index + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { goTo(i); });
    });
  });

  /* --- 出勤スケジュール共通データ ---
     各セラピストの days は月曜始まり7件の繰り返しテンプレート。休みの日は "off" を指定する。
     表示する日付は今日の日付から自動計算されるため、
     日付が変わっても手動で書き換える必要はない。 */
  var weekSchedule = [
    { name: "えりか", href: "therapist/01.html", photo: "images/therapists/01/1.png", days: ["12:00〜22:00", "12:00〜22:00", "off", "14:00〜22:00", "12:00〜22:00", "12:00〜24:00", "12:00〜22:00"] },
    { name: "みゆ",   href: "therapist/02.html", photo: "images/therapists/02/1.png", days: ["off", "14:00〜24:00", "14:00〜24:00", "14:00〜24:00", "off", "12:00〜22:00", "14:00〜22:00"] },
    { name: "さくら", href: "therapist/03.html", photo: "images/therapists/03/1.png", days: ["13:00〜21:00", "off", "13:00〜21:00", "13:00〜21:00", "13:00〜21:00", "off", "13:00〜21:00"] }
  ];

  var weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // 各日付の曜日インデックス（月=0〜日=6）。person.days の参照に使う。
  var weekdayIndexOf = function (date) {
    return date.getDay() === 0 ? 6 : date.getDay() - 1;
  };

  // "12:00〜22:00" のような文字列から開始時刻を分に変換する（並び替え用）。
  var startMinutesOf = function (timeRange) {
    var start = timeRange.split("〜")[0].split(":");
    return parseInt(start[0], 10) * 60 + parseInt(start[1], 10);
  };

  /* --- 本日の出勤（トップページ） --- */
  var todayScheduleList = document.getElementById("today-schedule-list");
  var todayScheduleDate = document.getElementById("today-schedule-date");

  if (todayScheduleList) {
    var todayIndex = weekdayIndexOf(today);
    var workingToday = weekSchedule.filter(function (person) {
      return person.days[todayIndex] !== "off";
    });

    todayScheduleList.innerHTML = "";

    if (workingToday.length === 0) {
      var emptyItem = document.createElement("li");
      emptyItem.className = "today-schedule__empty";
      emptyItem.textContent = "本日の出勤はお休みです。";
      todayScheduleList.appendChild(emptyItem);
    } else {
      workingToday.forEach(function (person) {
        var item = document.createElement("li");
        item.className = "today-schedule__item";

        var card = document.createElement("a");
        card.className = "today-schedule__card";
        card.href = person.href;

        var photo = document.createElement("img");
        photo.className = "today-schedule__photo";
        photo.src = person.photo;
        photo.alt = person.name;
        photo.onerror = function () {
          this.onerror = null;
          this.src = "images/therapists/no-image.png";
        };
        card.appendChild(photo);

        var info = document.createElement("span");
        info.className = "today-schedule__info";

        var name = document.createElement("span");
        name.className = "today-schedule__name";
        name.textContent = person.name;

        var time = document.createElement("span");
        time.className = "today-schedule__time";
        time.textContent = person.days[todayIndex];

        info.appendChild(name);
        info.appendChild(time);
        card.appendChild(info);

        item.appendChild(card);
        todayScheduleList.appendChild(item);
      });
    }

    if (todayScheduleDate) {
      todayScheduleDate.textContent =
        (today.getMonth() + 1) + "月" + today.getDate() + "日（" + weekdayLabels[todayIndex] + "）の出勤情報";
    }
  }

  /* --- 出勤情報（スケジュールページ／セラピストページと同じカード表示） ---
     今日から7日分の日付タブを表示し、クリック／タップで選んだ日の出勤情報に切り替える。 */
  var scheduleList = document.getElementById("schedule-list");
  var scheduleDate = document.getElementById("schedule-date");
  var scheduleDayTabs = document.getElementById("schedule-day-tabs");

  if (scheduleList && scheduleDayTabs) {
    var scheduleDates = [];
    for (var si = 0; si < 7; si++) {
      var sd = new Date(today);
      sd.setDate(today.getDate() + si);
      scheduleDates.push(sd);
    }

    var renderScheduleDay = function (dateIndex) {
      var date = scheduleDates[dateIndex];
      var weekdayIndex = weekdayIndexOf(date);

      var workingList = weekSchedule
        .filter(function (person) {
          return person.days[weekdayIndex] !== "off";
        })
        .sort(function (a, b) {
          return startMinutesOf(a.days[weekdayIndex]) - startMinutesOf(b.days[weekdayIndex]);
        });

      scheduleList.innerHTML = "";

      if (workingList.length === 0) {
        var emptyItem = document.createElement("li");
        emptyItem.className = "schedule__empty";
        emptyItem.textContent = "この日の出勤はお休みです。";
        scheduleList.appendChild(emptyItem);
      } else {
        workingList.forEach(function (person) {
          var item = document.createElement("li");
          item.className = "therapist-card";

          var photoLink = document.createElement("a");
          photoLink.className = "therapist-card__photo";
          photoLink.href = person.href;

          var photo = document.createElement("img");
          photo.src = person.photo;
          photo.alt = "セラピスト " + person.name;
          photo.onerror = function () {
            this.onerror = null;
            this.src = "images/therapists/no-image.png";
          };
          photoLink.appendChild(photo);
          item.appendChild(photoLink);

          var heading = document.createElement("h3");
          var nameLink = document.createElement("a");
          nameLink.className = "therapist-card__name-link";
          nameLink.href = person.href;
          nameLink.textContent = person.name;
          heading.appendChild(nameLink);
          item.appendChild(heading);

          var time = document.createElement("p");
          time.className = "therapist-card__time";
          time.textContent = person.days[weekdayIndex];
          item.appendChild(time);

          scheduleList.appendChild(item);
        });
      }

      if (scheduleDate) {
        scheduleDate.textContent =
          (date.getMonth() + 1) + "月" + date.getDate() + "日（" + weekdayLabels[weekdayIndex] + "）の出勤情報";
      }

      scheduleDayTabs.querySelectorAll(".schedule__day-tab").forEach(function (tab, i) {
        tab.classList.toggle("is-active", i === dateIndex);
        tab.setAttribute("aria-pressed", String(i === dateIndex));
      });
    };

    scheduleDayTabs.innerHTML = "";
    scheduleDates.forEach(function (date, i) {
      var weekdayIndex = weekdayIndexOf(date);

      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "schedule__day-tab";
      tab.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      if (i === 0) tab.classList.add("is-active");

      var tabDate = document.createElement("span");
      tabDate.className = "schedule__day-tab-date";
      tabDate.textContent = (date.getMonth() + 1) + "/" + date.getDate();
      tab.appendChild(tabDate);

      var tabWeekday = document.createElement("span");
      tabWeekday.className = "schedule__day-tab-weekday";
      tabWeekday.textContent = weekdayLabels[weekdayIndex];
      tab.appendChild(tabWeekday);

      tab.addEventListener("click", function () {
        renderScheduleDay(i);
      });

      scheduleDayTabs.appendChild(tab);
    });

    renderScheduleDay(0);
  }
})();
