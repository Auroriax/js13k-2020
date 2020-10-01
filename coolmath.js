function coolmathCallStart() {
    if (typeof parent.cmgGameEvent === "function") {
        try {
            parent.cmgGameEvent("start");
        } catch (e) {}
    }
    console.log("Coolmath: Game start event");
}

function coolmathCallLevelStart(level) {
    if (typeof parent.cmgGameEvent === "function") {
        try {
            parent.cmgGameEvent("start", String(level));
        } catch (e) {}
    }
    console.log("CoolMath: Level started " + level);
}

function coolmathCallLevelRestart(level) {
    if (typeof parent.cmgGameEvent === "function") {
        try {
            parent.cmgGameEvent("replay", String(level));
        } catch (e) {}
    }
    console.log("Coolmath: Level restart " + level);
}