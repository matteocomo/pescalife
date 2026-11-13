const ENTRY_NOTICE_KEY = "pescalife_entry_notice_v2";

// Inserire qui la access key pubblica del modulo Web3Forms per attivare l'invio.
const WEB3FORMS_ACCESS_KEY = "";

const byId = id => document.getElementById(id);

        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>"']/g, char => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            })[char]);
        }

        function showMessage(message, type = "success") {
            let element = byId("system-message");
            if (!element) {
                element = document.createElement("div");
                element.id = "system-message";
                element.setAttribute("role", "status");
                element.setAttribute("aria-live", "polite");
                document.body.appendChild(element);
            }
            element.textContent = message;
            element.style.background = type === "error" ? "#b42332" : "var(--color-accent)";
            element.style.color = type === "error" ? "#fff" : "var(--color-primary)";
            clearTimeout(element.messageTimeout);
            element.messageTimeout = setTimeout(() => element.remove(), 5000);
        }

        function dateInItalian(dateString) {
            const date = new Date(`${dateString}T12:00:00`);
            return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(date);
        }

        function setupEntryDialog() {
            const dialog = byId("entry-dialog");
            if (!dialog) return;
            let accepted = false;
            try { accepted = localStorage.getItem(ENTRY_NOTICE_KEY) === "true"; }
            catch (error) { console.warn("localStorage non disponibile; il banner verrà mostrato."); }
            if (accepted) return;
            dialog.hidden = false;
            document.body.classList.add("dialog-open");
            byId("entry-accept").focus();

            const close = () => {
                try { localStorage.setItem(ENTRY_NOTICE_KEY, "true"); }
                catch (error) { console.warn("Non è stato possibile memorizzare l'accettazione del banner in localStorage."); }
                dialog.hidden = true;
                document.body.classList.remove("dialog-open");
            };
            byId("entry-accept").addEventListener("click", close);
            byId("entry-legal-link").addEventListener("click", close);
            dialog.addEventListener("keydown", event => {
                if (event.key === "Enter" && event.target !== byId("entry-legal-link")) {
                    event.preventDefault();
                    close();
                }
                if (event.key === "Tab") {
                    const focusables = [byId("entry-accept"), byId("entry-legal-link")];
                    const current = focusables.indexOf(document.activeElement);
                    if (event.shiftKey && current <= 0) {
                        event.preventDefault();
                        focusables[focusables.length - 1].focus();
                    } else if (!event.shiftKey && (current === focusables.length - 1 || current === -1)) {
                        event.preventDefault();
                        focusables[0].focus();
                    }
                }
            });
        }

        function setupEventsNavigation() {
            const links = document.querySelector(".site-menu-links");
            const home = links.querySelector('a[href="index.html"]');
            if (!home) return;
            const url = new URL("eventi.html", home.href).href;
            if ([...links.querySelectorAll("a")].some(link => link.href === url)) return;
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.href = url;
            link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"></path></svg><span>Eventi</span>';
            item.append(link);
            links.append(item);
        }

        function setupEquipmentNavigation() {
            const links = document.querySelector(".site-menu-links");
            const home = links?.querySelector('a[href="index.html"]');
            if (!links || !home) return;
            const baseUrl = document.querySelector("base")?.href || home.href;
            const url = new URL("attrezzatura.html", baseUrl).href;
            if ([...links.querySelectorAll("a")].some(link => link.href === url)) return;
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.href = url;
            link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 4 21 20M5 6l5-3 3 3-3 5M14 13l-3 3 3 3 5-3"></path><path d="M8 16 4 20"></path></svg><span>Attrezzatura</span>';
            item.append(link);
            links.append(item);
        }

        function setupCreateFooterNavigation() {
            const explore = document.querySelector('.site-footer-links[aria-label="Esplora PescaLife"]');
            if (!explore || document.querySelector('.site-footer-links[aria-label="Crea"]')) return;
            const diaryLink = [...explore.querySelectorAll("a")].find(link =>
                new URL(link.href, location.href).pathname.endsWith("/diario.html")
            );
            if (!diaryLink) return;
            const home = document.querySelector(".site-footer-brand-name");
            const baseUrl = document.querySelector("base")?.href || home?.href || location.href;
            const createNav = document.createElement("nav");
            createNav.className = "site-footer-links";
            createNav.setAttribute("aria-label", "Crea");
            const heading = document.createElement("h2");
            heading.textContent = "Crea";
            const list = document.createElement("ul");
            const diaryItem = diaryLink.closest("li");
            diaryLink.href = new URL("diario.html", baseUrl).href;
            diaryItem.remove();
            list.append(diaryItem);
            const equipmentItem = document.createElement("li");
            const equipmentLink = document.createElement("a");
            equipmentLink.href = new URL("attrezzatura.html", baseUrl).href;
            equipmentLink.textContent = "Attrezzatura";
            equipmentItem.append(equipmentLink);
            list.append(equipmentItem);
            createNav.append(heading, list);
            explore.after(createNav);
        }

        function setupSiteMenu() {
            const menu = byId("site-menu");
            const toggle = byId("menu-toggle");
            const closeButton = byId("menu-close");
            const closeMenu = () => {
                if (!menu.classList.contains("open")) return;
                menu.classList.remove("open");
                menu.setAttribute("aria-hidden", "true");
                menu.inert = true;
                toggle.setAttribute("aria-expanded", "false");
                document.body.classList.remove("menu-open");
                toggle.focus();
            };
            const openMenu = () => {
                menu.inert = false;
                menu.setAttribute("aria-hidden", "false");
                menu.classList.add("open");
                toggle.setAttribute("aria-expanded", "true");
                document.body.classList.add("menu-open");
                closeButton.focus();
            };

            toggle.addEventListener("click", openMenu);
            closeButton.addEventListener("click", closeMenu);
            menu.querySelector(".site-menu-backdrop").addEventListener("click", closeMenu);
            menu.querySelectorAll(".site-menu-links a").forEach(link => link.addEventListener("click", closeMenu));
            menu.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu();
                    return;
                }
                if (event.key !== "Tab") return;
                const focusables = [...menu.querySelectorAll("a[href], button:not([disabled])")];
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            });
        }

        function setupActiveNavigation() {
            const currentPage = location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('.site-menu-links a').forEach(link => {
                if (new URL(link.href, location.href).pathname.split('/').pop() === currentPage) {
                    link.setAttribute('aria-current', 'page');
                }
            });
        }

        function setupFeedback() {
            const links = document.querySelectorAll(".feedback-link");
            if (!links.length) return;

            const dialog = document.createElement("dialog");
            dialog.className = "feedback-dialog";
            dialog.setAttribute("aria-labelledby", "feedback-title");
            dialog.setAttribute("aria-describedby", "feedback-description");
            dialog.innerHTML = `
                <div class="feedback-heading">
                    <h2 id="feedback-title">Segnala un problema o un suggerimento</h2>
                    <button class="feedback-close" type="button" aria-label="Chiudi">&times;</button>
                </div>
                <p id="feedback-description">Scrivi una segnalazione tecnica o un suggerimento. Non sono richiesti nome o email: non inserire dati personali.</p>
                <p>Il testo viene inviato tramite Web3Forms, che può trattare dati tecnici come l'indirizzo IP: l'anonimato assoluto non è garantito. <a href="https://web3forms.com/privacy" target="_blank" rel="noopener noreferrer">Privacy di Web3Forms</a>.</p>
                <form class="feedback-form">
                    <label for="feedback-message">Il tuo messaggio</label>
                    <textarea id="feedback-message" name="message" rows="5" maxlength="4000" required></textarea>
                    <p class="feedback-status" role="status" aria-live="polite"></p>
                    <button class="btn btn-primary feedback-submit" type="submit">Invia segnalazione</button>
                </form>`;
            document.body.append(dialog);
            const form = dialog.querySelector(".feedback-form");
            const message = dialog.querySelector("#feedback-message");
            const status = dialog.querySelector(".feedback-status");
            const submit = dialog.querySelector(".feedback-submit");
            const close = dialog.querySelector(".feedback-close");

            links.forEach(link => link.addEventListener("click", event => {
                event.preventDefault();
                if (!dialog.open) dialog.showModal();
                message.focus();
            }));
            close.addEventListener("click", () => dialog.close());
            dialog.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    dialog.close();
                }
            });
            dialog.addEventListener("click", event => {
                if (event.target === dialog) dialog.close();
            });
            form.addEventListener("submit", async event => {
                event.preventDefault();
                const text = message.value.trim();
                if (!text) {
                    status.textContent = "Scrivi un messaggio prima di inviare.";
                    message.focus();
                    return;
                }
                if (!WEB3FORMS_ACCESS_KEY.trim()) {
                    status.textContent = "L'invio delle segnalazioni non è ancora configurato.";
                    return;
                }
                submit.disabled = true;
                message.readOnly = true;
                status.textContent = "Invio in corso…";
                try {
                    const response = await fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        referrerPolicy: "no-referrer",
                        body: JSON.stringify({
                            access_key: WEB3FORMS_ACCESS_KEY.trim(),
                            subject: "Segnalazione PescaLife",
                            message: text
                        })
                    });
                    const result = await response.json();
                    if (!response.ok || result.success !== true) throw new Error("Invio non riuscito");
                    form.reset();
                    status.textContent = "Segnalazione inviata. Grazie per il tuo contributo!";
                } catch (error) {
                    console.error("Invio della segnalazione non riuscito:", error);
                    status.textContent = "Invio non riuscito. Riprova più tardi; il messaggio è rimasto nel modulo.";
                } finally {
                    submit.disabled = false;
                    message.readOnly = false;
                }
            });
        }

        document.addEventListener("DOMContentLoaded", () => {
            setupEventsNavigation();
            setupEquipmentNavigation();
            setupCreateFooterNavigation();
            setupSiteMenu();
            setupEntryDialog();
            setupActiveNavigation();
            setupFeedback();
        });
