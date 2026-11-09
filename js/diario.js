        const DIARY_STORAGE_KEY = "pescalife_diary_v1";
        let diaryEntries = [];
        let photoRemovedDuringEdit = false;

        function renderDiarySpots() {
            const spots = visibleSpots();
            byId("diary-spot").innerHTML = spots.length
                ? `<option value="" disabled selected>Seleziona uno spot</option>${spots.map(spot => `<option value="${escapeHtml(spot.id)}">${escapeHtml(spot.name)}${spot.verified ? "" : " — DA VERIFICARE"}</option>`).join("")}`
                : '<option value="non_indicato">Spot non indicato (nessuno spot verificato)</option>';
        }

        function loadDiary() {
            try {
                const stored = localStorage.getItem(DIARY_STORAGE_KEY);
                const parsed = stored ? JSON.parse(stored) : { entries: [] };
                diaryEntries = Array.isArray(parsed.entries) ? parsed.entries.filter(isValidEntry) : [];
            } catch (error) {
                console.error("Errore nel caricamento del diario locale:", error);
                diaryEntries = [];
                showMessage("Impossibile leggere il diario salvato. I dati presenti potrebbero non essere validi o accessibili.", "error");
            }
        }

        function isValidEntry(entry) {
            return Boolean(entry && typeof entry === "object" &&
                typeof entry.id === "string" && entry.id.length > 0 && entry.id.length <= 200 &&
                typeof entry.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
                !Number.isNaN(Date.parse(`${entry.date}T00:00:00Z`)) &&
                new Date(`${entry.date}T00:00:00Z`).toISOString().slice(0, 10) === entry.date &&
                typeof entry.spotId === "string" && entry.spotId.length <= 120 &&
                typeof entry.species === "string" && entry.species.trim().length > 0 && entry.species.length <= 80 &&
                (entry.weight === null || (typeof entry.weight === "number" && Number.isFinite(entry.weight) && entry.weight >= 0)) &&
                (entry.length === null || (typeof entry.length === "number" && Number.isFinite(entry.length) && entry.length >= 0)) &&
                typeof entry.notes === "string" && entry.notes.length <= 2000 &&
                (entry.photoDataUrl === null || (typeof entry.photoDataUrl === "string" && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(entry.photoDataUrl))));
        }

        function persistEntries(entries) {
            try {
                localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify({ entries }));
                diaryEntries = entries;
                renderDiaryList();
                return true;
            } catch (error) {
                console.error("Errore nel salvataggio del diario locale:", error);
                showMessage("Salvataggio non riuscito: lo spazio del browser potrebbe essere esaurito. Riduci o rimuovi le foto e riprova.", "error");
                return false;
            }
        }

        function compressPhoto(file) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                const objectUrl = URL.createObjectURL(file);
                image.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
                    const context = canvas.getContext("2d");
                    if (!context) { reject(new Error("Canvas non disponibile")); return; }
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.8));
                };
                image.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error("Impossibile leggere il file immagine"));
                };
                image.src = objectUrl;
            });
        }

        function renderDiaryList() {
            const list = byId("diary-list");
            const sorted = [...diaryEntries].sort((a, b) => b.date.localeCompare(a.date));
            if (!sorted.length) {
                list.innerHTML = '<p class="empty-state" id="no-entries">Ancora nessuna uscita salvata. Aggiungi la tua prima scheda di pesca.</p>';
                return;
            }
            list.innerHTML = sorted.map(entry => {
                const spotName = SPOT_DATA.find(spot => spot.id === entry.spotId)?.name || (entry.spotId === "non_indicato" ? "Spot non indicato" : entry.spotId);
                const notes = entry.notes || "";
                const notesPreview = notes.length > 100 ? `${notes.slice(0, 100)}…` : notes;
                return `<article class="diary-entry rounded-xl shadow-lg" data-id="${escapeHtml(entry.id)}">
                    <div class="diary-entry-content">
                        <p><strong>Data:</strong> ${escapeHtml(dateInItalian(entry.date))}</p>
                        <p><strong>Spot:</strong> <span class="text-accent">${escapeHtml(spotName)}</span></p>
                        <p><strong>Cattura:</strong> ${escapeHtml(entry.species)}
                            ${entry.weight !== null ? `(${escapeHtml(entry.weight)} kg` : ""}
                            ${entry.length !== null ? `${entry.weight !== null ? " / " : "("}${escapeHtml(entry.length)} cm` : ""}
                            ${(entry.weight !== null || entry.length !== null) ? ")" : ""}
                        </p>
                        ${notes ? `<p class="text-sm"><strong>Note:</strong> ${escapeHtml(notesPreview)}</p>` : ""}
                        ${entry.photoDataUrl ? `<img src="${escapeHtml(entry.photoDataUrl)}" class="diary-photo-preview" alt="Foto locale della cattura">` : ""}
                    </div>
                    <div class="diary-actions">
                        <button type="button" class="btn btn-secondary" data-action="download" data-id="${escapeHtml(entry.id)}" aria-label="Scarica scheda di ${escapeHtml(entry.species)}">Scarica scheda</button>
                        <button type="button" class="btn btn-secondary" data-action="edit" data-id="${escapeHtml(entry.id)}" aria-label="Modifica uscita del ${escapeHtml(entry.date)}">Modifica</button>
                        <button type="button" class="btn btn-danger" data-action="delete" data-id="${escapeHtml(entry.id)}" aria-label="Elimina uscita del ${escapeHtml(entry.date)}">Elimina</button>
                    </div>
                </article>`;
            }).join("");
        }

        async function handleDiarySubmit(event) {
            event.preventDefault();
            const entryId = byId("entry-id").value;
            const existing = diaryEntries.find(entry => entry.id === entryId);
            let photoDataUrl = existing && !photoRemovedDuringEdit ? existing.photoDataUrl : null;
            const photoFile = byId("diary-photo").files[0];
            if (photoFile) {
                try {
                    photoDataUrl = await compressPhoto(photoFile);
                } catch (error) {
                    console.error("Errore nella compressione della foto:", error);
                    showMessage("La foto non può essere letta o compressa. Prova con un altro file.", "error");
                    return;
                }
            }
            const entry = {
                id: entryId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
                date: byId("diary-date").value,
                spotId: byId("diary-spot").value,
                species: byId("diary-species").value.trim(),
                weight: byId("diary-weight").value ? Number(byId("diary-weight").value) : null,
                length: byId("diary-length").value ? Number(byId("diary-length").value) : null,
                notes: byId("diary-notes").value.trim(),
                photoDataUrl
            };
            if (!isValidEntry(entry)) {
                showMessage("Controlla i dati inseriti e riprova.", "error");
                return;
            }
            const nextEntries = existing
                ? diaryEntries.map(item => item.id === entry.id ? entry : item)
                : [...diaryEntries, entry];
            if (!persistEntries(nextEntries)) return;
            resetDiaryForm();
            showMessage(existing ? "Uscita aggiornata." : "Uscita salvata.");
        }

        function resetDiaryForm() {
            byId("diary-form").reset();
            byId("entry-id").value = "";
            byId("save-diary-btn").textContent = "Salva Uscita";
            byId("diary-photo-preview-form").hidden = true;
            byId("diary-photo-preview-form").removeAttribute("src");
            byId("remove-photo-btn").hidden = true;
            photoRemovedDuringEdit = false;
            const spots = visibleSpots();
            if (spots.length) byId("diary-spot").selectedIndex = 0;
        }

        function editDiaryEntry(id) {
            const entry = diaryEntries.find(item => item.id === id);
            if (!entry) return;
            byId("entry-id").value = entry.id;
            byId("diary-date").value = entry.date;
            byId("diary-spot").value = entry.spotId;
            byId("diary-species").value = entry.species;
            byId("diary-weight").value = entry.weight ?? "";
            byId("diary-length").value = entry.length ?? "";
            byId("diary-notes").value = entry.notes;
            photoRemovedDuringEdit = false;
            if (entry.photoDataUrl) {
                byId("diary-photo-preview-form").src = entry.photoDataUrl;
                byId("diary-photo-preview-form").hidden = false;
                byId("remove-photo-btn").hidden = false;
            } else {
                byId("diary-photo-preview-form").hidden = true;
                byId("remove-photo-btn").hidden = true;
            }
            byId("save-diary-btn").textContent = "Aggiorna Uscita";
            byId("diary-form").scrollIntoView({ behavior: "smooth" });
        }

        function deleteDiaryEntry(id) {
            if (!window.confirm("Sei sicuro di voler eliminare questa uscita?")) return;
            if (persistEntries(diaryEntries.filter(entry => entry.id !== id))) showMessage("Uscita eliminata.");
        }

        function exportDiary() {
            downloadBlob(new Blob([JSON.stringify({ entries: diaryEntries }, null, 2)], { type: "application/json" }),
                `pescalife_diary_export_${new Date().toISOString().slice(0, 10)}.json`);
            showMessage("Diario esportato in JSON.");
        }

        function downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        async function importDiary(file) {
            try {
                const parsed = JSON.parse(await file.text());
                if (!parsed || !Array.isArray(parsed.entries) || !parsed.entries.every(isValidEntry)) {
                    throw new Error("Struttura o campi non validi");
                }
                const existingIds = new Set(diaryEntries.map(entry => entry.id));
                const imported = parsed.entries.filter(entry => {
                    if (existingIds.has(entry.id)) return false;
                    existingIds.add(entry.id);
                    return true;
                });
                if (persistEntries([...diaryEntries, ...imported])) showMessage(`Importazione completata: ${imported.length} voci importate.`);
            } catch (error) {
                console.error("Errore durante l'importazione del diario:", error);
                showMessage("File JSON non valido o con campi non riconosciuti. Nessuna voce importata.", "error");
            } finally {
                byId("import-diary-file").value = "";
            }
        }

        function clearDiary() {
            if (!window.confirm("Vuoi cancellare definitivamente tutte le uscite e le foto salvate in questo browser?")) return;
            try {
                localStorage.removeItem(DIARY_STORAGE_KEY);
                diaryEntries = [];
                renderDiaryList();
                resetDiaryForm();
                showMessage("Tutti i dati del diario sono stati cancellati.");
            } catch (error) {
                console.error("Errore nella cancellazione del diario:", error);
                showMessage("Non è stato possibile cancellare i dati dal browser.", "error");
            }
        }

        function roundedRect(context, x, y, width, height, radius, fill, stroke, lineWidth = 1) {
            context.beginPath();
            context.roundRect(x, y, width, height, radius);
            if (fill) { context.fillStyle = fill; context.fill(); }
            if (stroke) { context.strokeStyle = stroke; context.lineWidth = lineWidth; context.stroke(); }
        }

        let brandLogoPromise;

        function loadBrandLogo() {
            if (!brandLogoPromise) {
                brandLogoPromise = new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error("Impossibile caricare il logo PescaLife"));
                    image.src = new URL("assets/favicon-pescalife/web-app-manifest-512x512.png", document.baseURI).href;
                });
            }
            return brandLogoPromise;
        }

        async function drawCardBase(context) {
            const background = context.createLinearGradient(0, 0, 1080, 1350);
            background.addColorStop(0, "#102943");
            background.addColorStop(0.58, "#0A1A2F");
            background.addColorStop(1, "#123c52");
            context.fillStyle = background;
            context.fillRect(0, 0, 1080, 1350);
            context.save();
            context.globalAlpha = 0.12;
            context.fillStyle = "#7AD7DF";
            context.beginPath();
            context.arc(1000, 180, 230, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.arc(80, 980, 280, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1;
            context.beginPath();
            context.moveTo(0, 1160);
            context.bezierCurveTo(270, 1080, 440, 1260, 700, 1160);
            context.bezierCurveTo(850, 1100, 960, 1120, 1080, 1155);
            context.lineTo(1080, 1350);
            context.lineTo(0, 1350);
            context.closePath();
            context.fillStyle = "#17617b";
            context.fill();
            context.beginPath();
            context.moveTo(0, 1210);
            context.bezierCurveTo(280, 1140, 500, 1290, 760, 1205);
            context.bezierCurveTo(900, 1160, 1000, 1180, 1080, 1200);
            context.lineTo(1080, 1350);
            context.lineTo(0, 1350);
            context.closePath();
            context.fillStyle = "#3AAFC6";
            context.fill();
            context.restore();
            roundedRect(context, 22, 22, 1036, 1306, 36, null, "rgba(122, 215, 223, 0.55)", 3);
            await drawCanvasLogo(context);
        }

        async function drawCanvasLogo(context) {
            const logo = await loadBrandLogo();
            context.save();
            roundedRect(context, 70, 55, 104, 104, 24, "#ffffff");
            context.drawImage(logo, 77, 62, 90, 90);
            context.fillStyle = "#F5FDFE";
            context.font = "bold 34px system-ui, sans-serif";
            context.fillText("PescaLife", 198, 102);
            context.fillStyle = "#A9DCE4";
            context.font = "20px system-ui, sans-serif";
            context.fillText("DIARIO DI PESCA  ·  VAL DI CECINA", 200, 136);
            context.restore();
        }

        function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
            const words = String(text || "").split(/\s+/).filter(Boolean);
            const lines = [];
            let line = "";
            let index = 0;
            for (; index < words.length; index++) {
                const candidate = line ? `${line} ${words[index]}` : words[index];
                if (context.measureText(candidate).width > maxWidth && line) {
                    lines.push(line);
                    line = words[index];
                    if (lines.length === maxLines) break;
                } else {
                    line = candidate;
                }
            }
            if (line && lines.length < maxLines) lines.push(line);
            const truncated = index < words.length;
            if (truncated && lines.length) {
                let last = lines[lines.length - 1];
                while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
                lines[lines.length - 1] = `${last.trimEnd()}…`;
            }
            lines.forEach((value, lineIndex) => context.fillText(value, x, y + lineIndex * lineHeight));
        }

        function drawInfoBox(context, label, value, x, y, width, height, maxLines = 2) {
            roundedRect(context, x, y, width, height, 20, "rgba(10, 26, 47, 0.72)", "rgba(169, 220, 228, 0.55)", 2);
            context.fillStyle = "#A9DCE4";
            context.font = "bold 18px system-ui, sans-serif";
            context.fillText(label, x + 24, y + 34);
            context.fillStyle = "#F5FDFE";
            context.font = "25px system-ui, sans-serif";
            drawWrappedText(context, value || "—", x + 24, y + 75, width - 48, 32, maxLines);
        }

        function loadLocalImage(dataUrl) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error("La foto locale non è leggibile"));
                image.src = dataUrl;
            });
        }

        async function drawEntryCard(entry) {
            const canvas = document.createElement("canvas");
            canvas.width = 1080;
            canvas.height = 1350;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Canvas non disponibile");
            await drawCardBase(context);
            const spot = SPOT_DATA.find(item => item.id === entry.spotId);
            context.fillStyle = "#7AD7DF";
            context.font = "bold 19px system-ui, sans-serif";
            context.fillText("RICORDO DI PESCA", 75, 205);
            context.fillStyle = "#F5FDFE";
            context.font = "bold 54px system-ui, sans-serif";
            drawWrappedText(context, entry.species, 75, 264, 930, 60, 1);
            context.fillStyle = "#7AD7DF";
            context.font = "24px system-ui, sans-serif";
            drawWrappedText(context, `${dateInItalian(entry.date)}  ·  ${spot?.name || (entry.spotId === "non_indicato" ? "Spot non indicato" : entry.spotId)}`, 75, 310, 930, 32, 1);

            const photoX = 75, photoY = 345, photoW = 930, photoH = 390;
            roundedRect(context, photoX, photoY, photoW, photoH, 26, "rgba(10, 26, 47, 0.72)", "rgba(169, 220, 228, 0.7)", 3);
            if (entry.photoDataUrl) {
                const image = await loadLocalImage(entry.photoDataUrl);
                const scale = Math.max(photoW / image.width, photoH / image.height);
                const cropW = photoW / scale, cropH = photoH / scale;
                context.save();
                context.beginPath();
                context.roundRect(photoX + 5, photoY + 5, photoW - 10, photoH - 10, 22);
                context.clip();
                context.drawImage(image, (image.width - cropW) / 2, (image.height - cropH) / 2, cropW, cropH, photoX + 5, photoY + 5, photoW - 10, photoH - 10);
                context.restore();
                roundedRect(context, photoX, photoY, photoW, photoH, 26, null, "rgba(169, 220, 228, 0.7)", 3);
            } else {
                context.textAlign = "center";
                context.font = "120px system-ui, sans-serif";
                context.fillStyle = "#F5FDFE";
                context.fillText(SPECIES_DATA.find(item => item.name.toLowerCase() === entry.species.toLowerCase())?.image || spot?.image || "🎣", 540, 535);
                context.textAlign = "left";
            }

            drawInfoBox(context, "PESO", entry.weight === null ? "Non indicato" : `${entry.weight} kg`, 75, 770, 440, 112);
            drawInfoBox(context, "LUNGHEZZA", entry.length === null ? "Non indicata" : `${entry.length} cm`, 535, 770, 470, 112);
            drawInfoBox(context, "NOTE", entry.notes || "Nessuna nota", 75, 910, 930, 215, 4);
            context.fillStyle = "#F5FDFE";
            context.font = "bold 19px system-ui, sans-serif";
            context.fillText("UNA PASSIONE, TANTI RICORDI", 75, 1265);
            context.textAlign = "right";
            context.fillStyle = "#E0F5F6";
            context.font = "18px system-ui, sans-serif";
            context.fillText("Pesca responsabile", 1005, 1265);
            context.textAlign = "left";
            return canvas;
        }

        function slugify(value) {
            return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "specie";
        }

        function canvasToBlob(canvas) {
            return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Impossibile generare il PNG")), "image/png"));
        }

        async function downloadEntryCard(id) {
            const entry = diaryEntries.find(item => item.id === id);
            if (!entry) return;
            try {
                const blob = await canvasToBlob(await drawEntryCard(entry));
                downloadBlob(blob, `pescalife_scheda_${entry.date}_${slugify(entry.species)}.png`);
            } catch (error) {
                console.error("Errore nella creazione della scheda PNG:", error);
                showMessage("Non è stato possibile creare la scheda PNG. Verifica che la foto salvata sia leggibile.", "error");
            }
        }

        async function downloadSeasonSummary() {
            const canvas = document.createElement("canvas");
            canvas.width = 1080;
            canvas.height = 1350;
            const context = canvas.getContext("2d");
            if (!context) { showMessage("Canvas non disponibile per creare il riepilogo.", "error"); return; }
            try {
                await drawCardBase(context);
            } catch (error) {
                console.error("Errore nel caricamento del logo del riepilogo:", error);
                showMessage("Non è stato possibile caricare il logo per il riepilogo.", "error");
                return;
            }
            const countBy = key => diaryEntries.reduce((counts, entry) => {
                const value = key === "spotId" ? (SPOT_DATA.find(item => item.id === entry.spotId)?.name || entry.spotId) : entry[key];
                counts[value] = (counts[value] || 0) + 1;
                return counts;
            }, {});
            const mostFrequent = key => Object.entries(countBy(key)).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
            context.fillStyle = "#F5FDFE";
            context.font = "bold 48px system-ui, sans-serif";
            context.fillText("Riepilogo stagione", 75, 205);
            context.fillStyle = "#7AD7DF";
            context.font = "27px system-ui, sans-serif";
            context.fillText(`Totale uscite: ${diaryEntries.length}`, 75, 265);
            context.fillText(`Totale catture: ${diaryEntries.length}`, 75, 310);
            context.fillText(`Specie più frequente: ${mostFrequent("species")}`, 75, 355);
            drawWrappedText(context, `Spot più frequente: ${mostFrequent("spotId")}`, 75, 400, 920, 38, 2);
            roundedRect(context, 75, 465, 930, 625, 24, "#102943", "#3AAFC6", 3);
            context.fillStyle = "#F5FDFE";
            context.font = "bold 30px system-ui, sans-serif";
            context.fillText("Ultime 5 uscite", 110, 520);
            const latest = [...diaryEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
            context.font = "24px system-ui, sans-serif";
            latest.forEach((entry, index) => {
                const spot = SPOT_DATA.find(item => item.id === entry.spotId)?.name || (entry.spotId === "non_indicato" ? "Spot non indicato" : entry.spotId);
                const label = `${dateInItalian(entry.date)} • ${entry.species} • ${spot}`;
                context.fillStyle = "#7AD7DF";
                drawWrappedText(context, label, 110, 585 + index * 92, 850, 32, 2);
            });
            context.fillStyle = "#F5FDFE";
            context.font = "bold 20px system-ui, sans-serif";
            context.fillText("Scheda cattura personale • Rispetta sempre la legge", 75, 1265);
            context.beginPath(); context.arc(930, 1250, 52, 0, Math.PI * 2);
            context.fillStyle = "#0A1A2F"; context.fill();
            context.strokeStyle = "#F5FDFE"; context.lineWidth = 3; context.stroke();
            context.fillStyle = "#F5FDFE"; context.font = "bold 17px system-ui, sans-serif"; context.textAlign = "center";
            context.fillText("PescaLife", 930, 1256); context.textAlign = "left";
            try {
                downloadBlob(await canvasToBlob(canvas), `pescalife_riepilogo_${new Date().toISOString().slice(0, 10)}.png`);
            } catch (error) {
                console.error("Errore nella creazione del riepilogo PNG:", error);
                showMessage("Non è stato possibile creare il riepilogo PNG.", "error");
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            renderDiarySpots();
            loadDiary();
            renderDiaryList();
            byId("diary-form").addEventListener("submit", handleDiarySubmit);
            byId("export-diary-btn").addEventListener("click", exportDiary);
            byId("export-summary-btn").addEventListener("click", downloadSeasonSummary);
            byId("import-diary-btn").addEventListener("click", () => byId("import-diary-file").click());
            byId("import-diary-file").addEventListener("change", event => {
                const file = event.target.files[0];
                if (file) importDiary(file);
            });
            byId("clear-diary-btn").addEventListener("click", clearDiary);
            byId("remove-photo-btn").addEventListener("click", () => {
                photoRemovedDuringEdit = true;
                byId("diary-photo").value = "";
                byId("diary-photo-preview-form").hidden = true;
                byId("diary-photo-preview-form").removeAttribute("src");
                byId("remove-photo-btn").hidden = true;
            });
            byId("diary-photo").addEventListener("change", event => {
                const file = event.target.files[0];
                if (!file) return;
                photoRemovedDuringEdit = true;
                const previewUrl = URL.createObjectURL(file);
                const preview = byId("diary-photo-preview-form");
                preview.onload = () => URL.revokeObjectURL(previewUrl);
                preview.src = previewUrl;
                preview.hidden = false;
                byId("remove-photo-btn").hidden = false;
            });
            byId("diary-list").addEventListener("click", event => {
                const button = event.target.closest("button[data-action]");
                if (!button) return;
                const { action, id } = button.dataset;
                if (action === "download") downloadEntryCard(id);
                if (action === "edit") editDiaryEntry(id);
                if (action === "delete") deleteDiaryEntry(id);
            });
        });
