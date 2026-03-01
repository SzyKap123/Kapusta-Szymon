document.addEventListener("DOMContentLoaded", function () {

    const przyciskMotyw = document.querySelector("#themeBtn");

    function zmienMotyw() {
        document.body.classList.toggle("dark");
    }

    przyciskMotyw.addEventListener("click", zmienMotyw);

    
        const przyciskLogowania = document.querySelector("#loginBtn");
        const poleLogin = document.querySelector("#loginInput");
        const wiadomosc = document.querySelector("#welcomeMsg");

    function zalogujUzytkownika() {
             if (poleLogin.value === "") {
            wiadomosc.innerText = "Proszę uzupełnić login.";
            wiadomosc.style.color = "red";
        } else {
            wiadomosc.innerText = "Witaj " + poleLogin.value + "!";
            wiadomosc.style.color = "green";
        }
    }

    przyciskLogowania.addEventListener("click", zalogujUzytkownika);

    const hasla = [
        "Dobry samochód to bezpieczna podróż.",
        "Stan techniczny jest ważniejszy niż rocznik.",
        "Regularny serwis przedłuża życie auta."
    ];

            const losowyNumer = Math.floor(Math.random() * hasla.length);
            const poleHasla = document.querySelector("#randomQuote");
    poleHasla.innerText = hasla[losowyNumer];

            const samochody = [
                ["Volkswagen Golf", "Rok 2016, silnik 1.6 TDI"],
                ["BMW Seria 3", "Rok 2015, silnik diesel"],
                ["Audi A4", "Rok 2017, benzyna"],
                ["Opel Astra", "Rok 2014, benzyna"],
                ["Toyota Corolla", "Rok 2018, hybryda"],
                ["Mercedes C-Class", "Rok 2019, silnik 2.0 diesel"],
                ["Ford Focus", "Rok 2016, silnik 1.5 benzyna"],
                ["Honda Civic", "Rok 2017, silnik 1.6 benzyna"],
                ["Mazda 3", "Rok 2018, silnik 2.0 benzyna"],
                ["Skoda Octavia", "Rok 2020, silnik 1.5 TSI"],
                ["Renault Megane", "Rok 2015, silnik 1.6 benzyna"],
                ["Peugeot 308", "Rok 2016, silnik 1.6 diesel"],
                ["Seat Leon", "Rok 2017, silnik 1.4 TSI"],
                ["Nissan Qashqai", "Rok 2018, silnik 1.3 benzyna"],
                ["Hyundai i30", "Rok 2019, silnik 1.0 turbo"],
                ["Kia Ceed", "Rok 2017, silnik 1.4 benzyna"],
                ["Toyota Yaris", "Rok 2020, silnik 1.5 hybryda"],
                ["BMW X1", "Rok 2018, silnik 2.0 diesel"],
                ["Audi Q3", "Rok 2019, silnik 2.0 benzyna"],
                ["Mercedes GLA", "Rok 2020, silnik 1.6 turbo"]
                ];

            const kontenerSamochodow = document.querySelector("#carsContainer");

    function wyswietlSamochody(lista) {
        kontenerSamochodow.innerHTML = "";

        for (let i = 0; i < lista.length; i++) {
            const karta = document.createElement("div");
            karta.className = "card";
            karta.innerHTML =
                "<h3>" + lista[i][0] + "</h3>" +
                "<p>" + lista[i][1] + "</p>";
            kontenerSamochodow.appendChild(karta);
        }
    }

    wyswietlSamochody(samochody);

            const poleSzukaj = document.querySelector("#searchInput");

    function szukajSamochodu() {
            const tekst = poleSzukaj.value.toLowerCase();

            const przefiltrowaneSamochody = samochody.filter(function (samochod) {
            return samochod[0].toLowerCase().includes(tekst);
        });

        wyswietlSamochody(przefiltrowaneSamochody);
    }

    poleSzukaj.addEventListener("input", szukajSamochodu);

});