// Imposta verified:true SOLO dopo aver controllato: accesso pubblico, divieti, licenze, ordinanze (Regione Toscana, Capitaneria di Porto, Comune).
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
