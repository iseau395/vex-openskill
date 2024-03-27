import { reprocessMatches } from "./event_processing.ts";
import { saveMatches } from "./event_processing.ts";
import { loadMatches } from "./event_processing.ts";
import { predictMatch } from "./event_processing.ts";
import { processEvent, logTeams, checkAccuracy } from "./event_processing.ts";
import { EventLevel } from "./robotevents-types.ts";
import { getSignatureEvents } from "./robotevents.ts";
import { getEventsRegion } from "./robotevents.ts";
import { getEvent } from "./robotevents.ts";

if (import.meta.main) {
    // const events = getEventsRegion(new Date(), "California - Region 4");
    const events = getSignatureEvents(new Date());
    for await (const event of events) {
        // if (event.level == EventLevel.Signature) continue; // skip over sigs if just processing a region
        await processEvent(event);
    }

    for (let i = 0; i < 6; i++) {
        reprocessMatches();
    }

    // await loadMatches(); // load cached matches from file

    // for (let i = 0; i < 7; i++) {
    //     reprocessMatches();
    // }

    // logTeams();
    const [accurate, total] = checkAccuracy();
    console.log(`Accuracy: ${Math.round(accurate / total * 100 * 100) / 100}% (${accurate}/${total})`);

    // await saveMatches();

    // allow for user input to predict matches
    while (true) {
        const red_1 = prompt("Red 1?")!.toUpperCase();
        const red_2 = prompt("Red 2?")!.toUpperCase();
        const blue_1 = prompt("Blue 1?")!.toUpperCase();
        const blue_2 = prompt("Blue 2?")!.toUpperCase();

        console.log(`Red has a ${Math.round(predictMatch(red_1, red_2, blue_1, blue_2) * 100 * 100)/100}% chance of winning`);
    }
}
