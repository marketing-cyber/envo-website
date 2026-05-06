/* ============================================================
   ENVO region detection + region banner + footer switcher
   ------------------------------------------------------------
   - Reads/writes localStorage key "envo-region" ("US" | "NZ")
   - First visit: ipapi.co lookup → if NZ default to NZ store, else US
   - First visit: shows top banner asking user to confirm region
   - After dismiss/confirm: never auto-shows banner again
   - Footer .region-switcher is always present, lets user change anytime
   - Exposes window.ENVO_REGION and `envo:region-changed` event
   ============================================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'envo-region';
    var STORE_LINKS = {
        US: { name: 'United States',  domain: 'powersupplymall.com', url: 'https://powersupplymall.com', ships: 'Ships globally from US warehouse' },
        NZ: { name: 'New Zealand',    domain: 'wellforces.co.nz',    url: 'https://wellforces.co.nz',    ships: 'New Zealand market' }
    };

    // Region-aware pricing CTA — each product page can override per-region URL via
    //   data-us-href="..." data-nz-href="..."  on the button itself.
    // Falls back to the partner home / collection if no override is supplied.
    var DEFAULT_HREF = {
        US: 'https://powersupplymall.com',
        NZ: 'https://wellforces.co.nz/collections/envo'
    };
    var DEFAULT_TEXT = {
        US: 'Where to Buy',
        NZ: 'Where to Buy'
    };
    function updatePricingButtons() {
        var region = window.ENVO_REGION || 'US';
        document.querySelectorAll('.region-pricing-btn').forEach(function (btn) {
            var attr = region === 'NZ' ? 'data-nz-href' : 'data-us-href';
            var href = btn.getAttribute(attr) || DEFAULT_HREF[region];
            btn.setAttribute('href', href);
            btn.setAttribute('target', '_blank');
            btn.setAttribute('rel', 'noopener');
            var label = btn.querySelector('.region-pricing-label');
            if (label) {
                var textAttr = region === 'NZ' ? 'data-nz-text' : 'data-us-text';
                label.textContent = btn.getAttribute(textAttr) || DEFAULT_TEXT[region];
            }
        });
    }

    function read() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }
    function write(r) {
        try { localStorage.setItem(STORAGE_KEY, r); } catch (e) {}
        window.ENVO_REGION = r;
        document.documentElement.setAttribute('data-region', r);
        updatePricingButtons();
        document.dispatchEvent(new CustomEvent('envo:region-changed', { detail: { region: r } }));
    }

    // Resolve current region (no fetching). Returns "US" or "NZ".
    function current() { return read() || 'US'; }

    // Detect region: try browser timezone first (instant + always accurate for NZ),
    // fall back to ipapi.co IP geolocation, fall back to US default.
    function detectFromIP() {
        // Step 1: timezone shortcut for NZ (Pacific/Auckland or Pacific/Chatham)
        try {
            var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
            if (tz === 'Pacific/Auckland' || tz === 'Pacific/Chatham') {
                return Promise.resolve({ region: 'NZ', country: 'New Zealand', source: 'tz' });
            }
        } catch (e) { /* old browser, skip */ }

        // Step 2: IP-based lookup
        return fetch('https://ipapi.co/json/')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (!data) return { region: 'US', country: null, source: 'fallback' };
                return {
                    region: data.country_code === 'NZ' ? 'NZ' : 'US',
                    country: data.country_name || null,
                    countryCode: data.country_code || null,
                    source: 'ip'
                };
            })
            .catch(function () { return { region: 'US', country: null, source: 'error' }; });
    }

    // Render the top banner
    function showBanner(suggestedRegion, detectedCountry) {
        if (document.querySelector('.region-banner')) return;

        var lead = 'ENVO works with regional partners — set your region for local availability and support info.';

        var bar = document.createElement('div');
        bar.className = 'region-banner';
        bar.innerHTML = ''
            + '<div class="container region-banner-inner">'
            +   '<span class="rb-text">' + lead + '</span>'
            +   '<div class="rb-select-wrap">'
            +     '<select class="rb-select" aria-label="Select your region">'
            +       '<option value="US"' + (suggestedRegion === 'US' ? ' selected' : '') + '>United States · Global</option>'
            +       '<option value="NZ"' + (suggestedRegion === 'NZ' ? ' selected' : '') + '>New Zealand</option>'
            +     '</select>'
            +   '</div>'
            +   '<button type="button" class="rb-continue">Continue</button>'
            +   '<button type="button" class="rb-close" aria-label="Dismiss">×</button>'
            + '</div>';
        document.body.insertBefore(bar, document.body.firstChild);
        document.body.classList.add('has-region-banner');

        var sel = bar.querySelector('.rb-select');
        var commit = function () {
            write(sel.value);
            bar.remove();
            document.body.classList.remove('has-region-banner');
        };
        bar.querySelector('.rb-continue').addEventListener('click', commit);
        bar.querySelector('.rb-close').addEventListener('click', function () {
            // Close without explicit choice → still mark as seen so it doesn't reappear
            write(sel.value || suggestedRegion);
            bar.remove();
            document.body.classList.remove('has-region-banner');
        });
    }

    // Inject the persistent footer switcher (small select dropdown at bottom)
    function injectFooterSwitcher() {
        if (document.querySelector('.region-switcher')) return;
        var foot = document.querySelector('.footer-bottom .container');
        if (!foot) return;
        var span = document.createElement('span');
        span.className = 'region-switcher';
        span.innerHTML = ''
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a14 14 0 0 1 0 20a14 14 0 0 1 0-20"/></svg>'
            + '<select class="region-switcher-select" aria-label="Change region">'
            +   '<option value="US">United States · Global</option>'
            +   '<option value="NZ">New Zealand</option>'
            + '</select>';
        foot.appendChild(span);

        var sel = span.querySelector('select');
        sel.value = current();
        sel.addEventListener('change', function () { write(sel.value); });
    }

    // Public helper: reveal store info for a given region
    window.ENVO_STORES = STORE_LINKS;
    window.ENVO_REGION = current();
    document.documentElement.setAttribute('data-region', window.ENVO_REGION);

    // Inline switch buttons in buy-card hints (e.g. "Switch to NZ store →")
    function bindSwitchButtons() {
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-switch-region]');
            if (!btn) return;
            e.preventDefault();
            var target = btn.getAttribute('data-switch-region');
            if (target === 'US' || target === 'NZ') {
                write(target);
                // Sync footer dropdown if present
                var foot = document.querySelector('.region-switcher-select');
                if (foot) foot.value = target;
            }
        });
    }

    // Boot
    document.addEventListener('DOMContentLoaded', function () {
        injectFooterSwitcher();
        bindSwitchButtons();
        updatePricingButtons();

        // Only auto-show banner on first visit
        if (read()) return;
        detectFromIP().then(function (info) {
            // Persist suggested as the working region (so purchase blocks render correctly even if banner stays open)
            window.ENVO_REGION = info.region;
            document.documentElement.setAttribute('data-region', info.region);
            showBanner(info.region, info.country);
        });
    });
})();
