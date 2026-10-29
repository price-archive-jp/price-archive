/* UNIQLO 価格アーカイブ（非公式） — site.js
   依存ライブラリなし。タブ切り替えと表の絞り込み・並べ替えだけを行う。 */
(function () {
  "use strict";

  /* ---------- tabs ---------- */
  function setupTabs() {
    var tablist = document.querySelector("[data-tabs]");
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[data-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-tab-panel]"));
    if (!tabs.length || !panels.length) return;

    function activate(kind, updateHash) {
      tabs.forEach(function (tab) {
        var selected = tab.getAttribute("data-tab") === kind;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.setAttribute("tabindex", selected ? "0" : "-1");
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-tab-panel") !== kind;
      });
      if (updateHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + kind);
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activate(tab.getAttribute("data-tab"), true);
      });
      tab.addEventListener("keydown", function (event) {
        var index = tabs.indexOf(tab);
        var next = null;
        if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (event.key === "Home") next = tabs[0];
        if (event.key === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        event.preventDefault();
        next.focus();
        activate(next.getAttribute("data-tab"), true);
      });
    });

    var hash = (window.location.hash || "").replace("#", "");
    var hasHash = tabs.some(function (tab) {
      return tab.getAttribute("data-tab") === hash;
    });
    activate(hasHash ? hash : tabs[0].getAttribute("data-tab"), false);
  }

  /* ---------- filter / sort ---------- */
  function setupFilters() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-filter-form]"));
    forms.forEach(function (form) {
      var tableId = form.getAttribute("data-table-target");
      var table = tableId ? document.getElementById(tableId) : null;
      if (!table || !table.tBodies.length) return;
      var tbody = table.tBodies[0];
      var rows = Array.prototype.slice.call(tbody.rows).filter(function (row) {
        return typeof row.dataset.name !== "undefined";
      });
      if (!rows.length) return;

      var countLabel = form.querySelector("[data-result-count]");
      var search = form.querySelector('[data-filter="name"]');
      var gender = form.querySelector('[data-filter="gender"]');
      var collection = form.querySelector('[data-filter="collection"]');
      var sort = form.querySelector("[data-sort]");

      rows.forEach(function (row, index) {
        row.dataset.order = String(index);
      });

      var emptyRow = document.createElement("tr");
      emptyRow.className = "js-empty-row";
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = table.tHead ? table.tHead.rows[0].cells.length : 8;
      emptyCell.textContent = "条件に一致する商品がありません。";
      emptyCell.className = "muted";
      emptyCell.style.textAlign = "center";
      emptyCell.style.padding = "1.4rem";
      emptyRow.appendChild(emptyCell);
      emptyRow.hidden = true;
      tbody.appendChild(emptyRow);

      function number(row, key) {
        var value = parseInt(row.dataset[key] || "0", 10);
        return isNaN(value) ? 0 : value;
      }

      function sortRows() {
        var mode = sort ? sort.value : "order";
        var sorted = rows.slice();
        if (mode === "price-asc") {
          sorted.sort(function (a, b) { return number(a, "price") - number(b, "price"); });
        } else if (mode === "price-desc") {
          sorted.sort(function (a, b) { return number(b, "price") - number(a, "price"); });
        } else if (mode === "lowest-asc") {
          sorted.sort(function (a, b) { return number(a, "lowest") - number(b, "lowest"); });
        } else if (mode === "drop-desc") {
          sorted.sort(function (a, b) { return number(b, "drop") - number(a, "drop"); });
        } else if (mode === "date-desc") {
          sorted.sort(function (a, b) {
            return (b.dataset.date || "").localeCompare(a.dataset.date || "");
          });
        } else {
          sorted.sort(function (a, b) {
            return number(a, "order") - number(b, "order");
          });
        }
        sorted.forEach(function (row) {
          tbody.insertBefore(row, emptyRow);
        });
      }

      function apply() {
        sortRows();
        var term = search ? search.value.trim().toLowerCase() : "";
        var genderValue = gender ? gender.value : "";
        var collectionValue = collection ? collection.value : "";
        var visible = 0;

        rows.forEach(function (row) {
          var haystack = ((row.dataset.name || "") + " " + (row.dataset.id || "")).toLowerCase();
          var show = true;
          if (term && haystack.indexOf(term) === -1) show = false;
          if (genderValue && row.dataset.gender !== genderValue) show = false;
          if (collectionValue && row.dataset.collection !== collectionValue) show = false;
          row.hidden = !show;
          if (show) visible += 1;
        });

        emptyRow.hidden = visible !== 0;
        if (countLabel) {
          countLabel.textContent =
            visible === rows.length
              ? rows.length + "件"
              : visible + " / " + rows.length + "件";
        }
      }

      [search, gender, collection, sort].forEach(function (control) {
        if (!control) return;
        control.addEventListener(control.tagName === "INPUT" ? "input" : "change", apply);
      });
      form.addEventListener("reset", function () {
        window.setTimeout(apply, 0);
      });
      apply();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setupTabs();
      setupFilters();
    });
  } else {
    setupTabs();
    setupFilters();
  }
})();
