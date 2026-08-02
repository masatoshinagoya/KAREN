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

  /* --- ヒーロー スライドショー（フェード / インジケーター無し） --- */
  var slides = document.querySelectorAll(".hero__slide");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (slides.length > 1 && !reduceMotion) {
    var current = 0;
    var INTERVAL_MS = 6000;

    setInterval(function () {
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, INTERVAL_MS);
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

  /* --- 今週の出勤情報 ---
     各セラピストの days は月曜始まり7件の繰り返しテンプレート。休みの日は "off" を指定する。
     表示する週（月曜日の日付）は今日の日付から自動計算されるため、
     日付が変わっても手動で書き換える必要はなく、週が進むと自動的に表示も進む。 */
  var weekSchedule = [
    { name: "えりか", days: ["12:00〜22:00", "12:00〜22:00", "off", "14:00〜22:00", "12:00〜22:00", "12:00〜24:00", "12:00〜22:00"] },
    { name: "みゆ",   days: ["off", "14:00〜24:00", "14:00〜24:00", "14:00〜24:00", "off", "12:00〜22:00", "14:00〜22:00"] },
    { name: "さくら", days: ["13:00〜21:00", "off", "13:00〜21:00", "13:00〜21:00", "13:00〜21:00", "off", "13:00〜21:00"] }
  ];

  var scheduleHeadRow = document.getElementById("schedule-table-head");
  var scheduleBody = document.getElementById("schedule-table-body");
  var scheduleDate = document.getElementById("schedule-date");

  if (scheduleHeadRow && scheduleBody) {
    var weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // 今日を含む週の月曜日を求める（日曜=0なので6日前、それ以外は月曜からの日数分戻る）
    var mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
    var start = new Date(today);
    start.setDate(today.getDate() + mondayOffset);

    var dates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }

    scheduleHeadRow.innerHTML = "";
    var nameHead = document.createElement("th");
    nameHead.scope = "col";
    nameHead.textContent = "セラピスト";
    scheduleHeadRow.appendChild(nameHead);

    dates.forEach(function (d, i) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = (d.getMonth() + 1) + "/" + d.getDate() + "(" + weekdayLabels[i] + ")";
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

      person.days.forEach(function (value, i) {
        var cell = document.createElement("td");
        if (value === "off") {
          cell.textContent = "休み";
          cell.classList.add("is-off");
        } else {
          cell.textContent = value;
        }
        if (dates[i].getTime() === today.getTime()) {
          cell.classList.add("is-today");
        }
        row.appendChild(cell);
      });

      scheduleBody.appendChild(row);
    });

    if (scheduleDate) {
      var end = dates[6];
      scheduleDate.textContent =
        (start.getMonth() + 1) + "月" + start.getDate() + "日（月）〜" +
        (end.getMonth() + 1) + "月" + end.getDate() + "日（日）の出勤情報";
    }
  }
})();
