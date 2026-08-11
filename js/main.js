(function () {
  "use strict";

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
  initFadeSlideshow(document.querySelectorAll(".intro-banner__slide"));

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
    { name: "えりか", days: ["12:00〜22:00", "12:00〜22:00", "off", "14:00〜22:00", "12:00〜22:00", "12:00〜24:00", "12:00〜22:00"] },
    { name: "みゆ",   days: ["off", "14:00〜24:00", "14:00〜24:00", "14:00〜24:00", "off", "12:00〜22:00", "14:00〜22:00"] },
    { name: "さくら", days: ["13:00〜21:00", "off", "13:00〜21:00", "13:00〜21:00", "13:00〜21:00", "off", "13:00〜21:00"] }
  ];

  var weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // 各日付の曜日インデックス（月=0〜日=6）。person.days の参照に使う。
  var weekdayIndexOf = function (date) {
    return date.getDay() === 0 ? 6 : date.getDay() - 1;
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

        var name = document.createElement("span");
        name.className = "today-schedule__name";
        name.textContent = person.name;

        var time = document.createElement("span");
        time.className = "today-schedule__time";
        time.textContent = person.days[todayIndex];

        item.appendChild(name);
        item.appendChild(time);
        todayScheduleList.appendChild(item);
      });
    }

    if (todayScheduleDate) {
      todayScheduleDate.textContent =
        (today.getMonth() + 1) + "月" + today.getDate() + "日（" + weekdayLabels[todayIndex] + "）の出勤情報";
    }
  }

  /* --- 今週の出勤情報（スケジュールページ） --- */
  var scheduleHeadRow = document.getElementById("schedule-table-head");
  var scheduleBody = document.getElementById("schedule-table-body");
  var scheduleDate = document.getElementById("schedule-date");

  if (scheduleHeadRow && scheduleBody) {
    // 今日から先7日分の日付を作る
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }

    scheduleHeadRow.innerHTML = "";
    var nameHead = document.createElement("th");
    nameHead.scope = "col";
    nameHead.textContent = "セラピスト";
    scheduleHeadRow.appendChild(nameHead);

    dates.forEach(function (d) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = (d.getMonth() + 1) + "/" + d.getDate() + "(" + weekdayLabels[weekdayIndexOf(d)] + ")";
      if (d.getTime() === today.getTime()) {
        th.classList.add("is-today");
      }
      scheduleHeadRow.appendChild(th);
    });

    scheduleBody.innerHTML = "";
    weekSchedule.forEach(function (person) {
      var row = document.createElement("tr");

      var nameCell = document.createElement("th");
      nameCell.scope = "row";
      nameCell.textContent = person.name;
      row.appendChild(nameCell);

      dates.forEach(function (d) {
        var value = person.days[weekdayIndexOf(d)];
        var cell = document.createElement("td");
        if (value === "off") {
          cell.textContent = "休み";
          cell.classList.add("is-off");
        } else {
          cell.textContent = value;
        }
        if (d.getTime() === today.getTime()) {
          cell.classList.add("is-today");
        }
        row.appendChild(cell);
      });

      scheduleBody.appendChild(row);
    });

    if (scheduleDate) {
      var end = dates[6];
      scheduleDate.textContent =
        (today.getMonth() + 1) + "月" + today.getDate() + "日（" + weekdayLabels[weekdayIndexOf(today)] + "）〜" +
        (end.getMonth() + 1) + "月" + end.getDate() + "日（" + weekdayLabels[weekdayIndexOf(end)] + "）の出勤情報";
    }
  }
})();
