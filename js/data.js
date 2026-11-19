// Imposta verified:true SOLO dopo aver controllato: accesso pubblico, divieti, licenze, ordinanze (Regione Toscana, Capitaneria di Porto, Comune).
        const DIARY_PLACES = [
            { id: "luogo:fiume-cecina", name: "Fiume Cecina" },
            { id: "luogo:torrente-possera", name: "Torrente Possera" },
            { id: "luogo:torrente-sterza", name: "Torrente Sterza" },
            { id: "luogo:torrente-trossa", name: "Torrente Trossa" },
            { id: "luogo:torrente-pavone", name: "Torrente Pavone" },
            { id: "luogo:torrente-acquerta", name: "Torrente Acquerta" },
            { id: "luogo:torrente-sellate", name: "Torrente Sellate" },
            { id: "luogo:torrente-fosci", name: "Torrente Fosci" },
            { id: "luogo:torrente-lopia", name: "Torrente Lopia" },
            { id: "luogo:torrente-lupicaia", name: "Torrente Lupicaia" },
            { id: "luogo:torrente-le-botra", name: "Torrente Le Botra" },
            { id: "luogo:torrente-cortolla", name: "Torrente Cortolla" },
            { id: "luogo:torrente-zambra", name: "Torrente Zambra" },
            { id: "luogo:torrente-rimaggio", name: "Torrente Rimaggio" },
            { id: "luogo:torrente-secolo", name: "Torrente Secolo" },
            { id: "luogo:torrente-rialdo", name: "Torrente Rialdo" },
            { id: "luogo:torrente-il-botrone", name: "Torrente Il Botrone" },
            { id: "luogo:torrente-sterzola", name: "Torrente Sterzola" },
            { id: "luogo:torrente-rinotri", name: "Torrente Rinotri" },
            { id: "luogo:torrente-racquese", name: "Torrente Racquese" },
            { id: "luogo:torrente-ritasso", name: "Torrente Ritasso" },
            { id: "luogo:torrente-riscone", name: "Torrente Riscone" },
            { id: "luogo:torrente-rimonese", name: "Torrente Rimonese" },
            { id: "luogo:torrente-sorgente-del-molinaccio", name: "Torrente Sorgente del Molinaccio" },
            { id: "luogo:fosso-adio", name: "Fosso Adio" },
            { id: "luogo:fosso-vetrialla-mensanese", name: "Fosso Vetrialla Mensanese" },
            { id: "luogo:fosso-linaglia", name: "Fosso Linaglia" },
            { id: "luogo:botro-dei-mulini", name: "Botro dei Mulini" },
            { id: "luogo:fosso-fodera", name: "Fosso Fodera" },
            { id: "luogo:botro-del-bonicolo", name: "Botro del Bonicolo" },
            { id: "luogo:fosso-lucignano", name: "Fosso Lucignano" },
            { id: "luogo:botro-del-poggio", name: "Botro del Poggio" },
            { id: "luogo:botro-di-gello", name: "Botro di Gello" },
            { id: "luogo:botro-dell-arbiaia", name: "Botro dell'Arbiaia" },
            { id: "luogo:botro-dei-canonaci", name: "Botro dei Canonaci" },
            { id: "luogo:botro-grande", name: "Botro Grande" },
            { id: "luogo:fosso-ricavolo", name: "Fosso Ricavolo" },
            { id: "luogo:botro-delle-pilelle", name: "Botro delle Pilelle" },
            { id: "luogo:botro-della-canonica", name: "Botro della Canonica" },
            { id: "luogo:botro-dei-doccini", name: "Botro dei Doccini" },
            { id: "luogo:botro-del-fiascolla", name: "Botro del Fiascolla" },
            { id: "luogo:botro-del-vallone", name: "Botro del Vallone" },
            { id: "luogo:botro-dei-trogoli", name: "Botro dei Trogoli" },
            { id: "luogo:botro-torbo", name: "Botro Torbo" },
            { id: "luogo:botro-del-lenzo", name: "Botro del Lenzo" },
            { id: "luogo:rio-di-pomarance", name: "Rio di Pomarance" },
            { id: "luogo:botro-del-rio-di-querceto", name: "Botro del Rio di Querceto" },
            { id: "luogo:botro-rivivo", name: "Botro Rivivo" },
            { id: "luogo:botro-di-bagnolo", name: "Botro di Bagnolo" },
            { id: "luogo:botro-lupicaia", name: "Botro Lupicaia" },
            { id: "luogo:botro-dell-acqua-salata", name: "Botro dell'Acqua Salata" },
            { id: "luogo:fosso-ritretine", name: "Fosso Ritretine" },
            { id: "luogo:botro-di-rioddi", name: "Botro di Rioddi" },
            { id: "luogo:botro-della-fonte", name: "Botro della Fonte" },
            { id: "luogo:botro-del-peruccio", name: "Botro del Peruccio" },
            { id: "luogo:botro-di-decimo", name: "Botro di Decimo" },
            { id: "luogo:botro-di-sabbia", name: "Botro di Sabbia" },
            { id: "luogo:botro-di-tracolle", name: "Botro di Tracolle" },
            { id: "luogo:botro-di-bucignano", name: "Botro di Bucignano" },
            { id: "luogo:valle-vettoni", name: "Valle Vettoni" },
            { id: "luogo:fosso-petriolo", name: "Fosso Petriolo" },
            { id: "luogo:botro-dello-smorto", name: "Botro dello Smorto" },
            { id: "luogo:fosso-brotone", name: "Fosso Brotone" }
        ];

        const SPOT_DATA = [
            {
                id: "foce_cecina", name: "Foce del Cecina", description: "Area costiera presso la foce del Cecina.",
                image: "🌊🎣", techniques: ["Spinning", "Bolognese", "Inglese"], recommendedBaits: ["Gambero", "Bigattino", "Artificiali"],
                bestTime: "Orari indicativi: alba o tramonto.", lat: 43.318, lon: 10.490, verified: false, access: "da verificare",
                rulesNote: "Verifica divieti, distanze da stabilimenti/foci/manufatti, zone protette e licenza (acque interne) sui siti ufficiali."
            },
            {
                id: "marina_cecina", name: "Marina di Cecina (lungomare e spiaggia libera)", description: "Tratto costiero di Marina di Cecina.",
                image: "🌊🏖️", techniques: ["Feeder", "Legering", "Surfcasting"], recommendedBaits: ["Arenicola", "Muriddu", "Pezzetto"],
                bestTime: "Orari indicativi: da valutare in base alle condizioni locali.", lat: 43.320, lon: 10.495, verified: false, access: "da verificare",
                rulesNote: "Verifica divieti, distanze da stabilimenti/foci/manufatti, zone protette e licenza (acque interne) sui siti ufficiali."
            },
            {
                id: "la_mazzanta", name: "La Mazzanta", description: "Tratto costiero della Mazzanta.",
                image: "🌅🌊", techniques: ["Surfcasting", "Teleferica"], recommendedBaits: ["Arenicola", "Muriddu"],
                bestTime: "Orari ed esche indicative: verifica condizioni e regole locali.", lat: 43.360, lon: 10.450, verified: false, access: "da verificare",
                rulesNote: "Verifica divieti, distanze da stabilimenti/foci/manufatti, zone protette e licenza (acque interne) sui siti ufficiali."
            },
            {
                id: "fiume_cecina", name: "Fiume Cecina (tratto Steccaia)", description: "Tratto del fiume Cecina in località Steccaia.",
                image: "🏞️💧", techniques: ["Spinning", "Mosca", "Passata"], recommendedBaits: ["Cucchiaini", "Mosche secche", "Mais"],
                bestTime: "Orari ed esche indicative: verifica condizioni e regole locali.", lat: 43.365, lon: 10.550, verified: false, access: "da verificare",
                rulesNote: "Verifica divieti, distanze da stabilimenti/foci/manufatti, zone protette e licenza (acque interne) sui siti ufficiali."
            }
        ];
        const SHOW_UNVERIFIED = false;

        const SPECIES_DATA = [
            { name: "Spigola (Branzino)", image: "🐺", environment: "Mare", idealSeason: "Stagione indicativa: autunno/inverno", baits: ["Gambero", "Artificiali siliconici", "Minnow"] },
            { name: "Orata", image: "👑", environment: "Mare", idealSeason: "Stagione indicativa: primavera/estate", baits: ["Muriddu", "Coreano", "Vongola"] },
            { name: "Serra (Pesce Serra)", image: "🐟", environment: "Mare", idealSeason: "Stagione indicativa: estate/autunno", baits: ["Minnow", "Popper", "Vivo"] },
            { name: "Mormora", image: "🐚", environment: "Mare", idealSeason: "Stagione indicativa: variabile", baits: ["Arenicola", "Tremolina", "Muriddu"] },
            { name: "Cefalo (Muggine)", image: "🐟", environment: "Mare", idealSeason: "Stagione indicativa: variabile", baits: ["Pastella", "Bigattino", "Pane"] },
            { name: "Cavedano", image: "🏞️", environment: "Fiume", idealSeason: "Stagione indicativa: variabile", baits: ["Baco", "Mais", "Piccoli artificiali"] }
        ];
        const SPECIES_UNVERIFIED = [
            { name: "Trota Fario", image: "🐟", environment: "Fiume", idealSeason: "Stagione indicativa: da verificare", baits: ["Cucchiaini", "Mosche secche", "Camole"] }
        ];

        const visibleSpots = () => SPOT_DATA.filter(spot => spot.verified === true || SHOW_UNVERIFIED);
