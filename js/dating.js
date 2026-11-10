/* =====================================================================
   VISITOR COUNTER (datingPage.html)
   GitHub Pages can't store data, so the count is kept by Abacus, a free
   counter service: https://abacus.jasoncameron.dev
   - A new visitor adds 1 to the count and gets that number.
   - Their number is remembered in this browser, so refreshing the page
     or coming back doesn't count them twice.
   ===================================================================== */

(function () {
    const COUNTER_URL = "https://abacus.jasoncameron.dev/hit/cryptid-corner/dating-page-visitors";
    const SAVED_KEY = "cryptidDatingVisitorNumber";   // where this browser remembers its number
    const DIGITS = 6;                                 // shows 000042 instead of 42

    const display = document.getElementById("hits");

    function show(number) {
        display.textContent = String(number).padStart(DIGITS, "0");
    }

    // localStorage can be blocked (private windows, strict settings), so never let it break the page
    function getSaved() {
        try { return localStorage.getItem(SAVED_KEY); } catch (error) { return null; }
    }
    function save(number) {
        try { localStorage.setItem(SAVED_KEY, number); } catch (error) { /* just won't be remembered */ }
    }

    // returning visitor: show the number they got the first time
    const saved = getSaved();
    if (saved) {
        show(saved);
        return;
    }

    // new visitor: add 1 to the shared count
    fetch(COUNTER_URL)
        .then(response => {
            if (!response.ok) throw new Error("Counter answered " + response.status);
            return response.json();
        })
        .then(data => {
            show(data.value);
            save(data.value);
        })
        .catch(() => {
            display.textContent = "??????";
            display.title = "The visitor counter is offline right now";
        });
})();
