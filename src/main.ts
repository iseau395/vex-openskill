import { pruneTeamsByRegion, loadMatches, processEvent, saveMatches, logTeams, processMatches, predictMatch, checkAccuracy, resetOS, setOSSettings } from "./event_processing.ts";
import { EventLevel } from "./robotevents-types.ts";
import { getAllEvents, getEvent, getEventsRegion, getSignatureEvents } from "./robotevents.ts";

if (import.meta.main) {
    const start_time = Date.now();

    // const events = getAllEvents();
    // // const events = getSignatureEvents();
    // let i = 0;
    // for await (const event of events) {
    //     // if (event.level == EventLevel.Signature || event.name.toLowerCase().includes("one world")) continue; // skip over sigs if just processing a region to get rid of out-of-region teams
    //     // if (event.location.country != "United States") continue; // only look at US sigs
    //     await processEvent(event);

    //     i++;
    //     if (i % 50 == 0) {
    //         await saveMatches();
    //     }
    // }

    // await saveMatches();

    // await processEvent(await getEvent("RE-VRC-23-4809"));

    await loadMatches(); // load cached matches from file

    for (let j = 0; j < 5; j++) {
        processMatches();
    }

    const [accurate, total] = checkAccuracy();

    // await pruneTeamsByRegion("California"); // get rid of some of the teams who aren't in the region (doesn't get rid of all)
    logTeams("world", accurate/total);
    console.log(`Accuracy: ${Math.round(accurate / total * 100 * 100) / 100}% (${accurate}/${total})`);

    const total_time = Date.now() - start_time;

    console.log(`Time: ${total_time / 1000}s`);

    // allow for user input to predict matches
    while (true) {
        const red_1 = prompt("Red 1?")!.toUpperCase();
        const red_2 = prompt("Red 2?")!.toUpperCase();
        const blue_1 = prompt("Blue 1?")!.toUpperCase();
        const blue_2 = prompt("Blue 2?")!.toUpperCase();

        console.log(`Red has a ${Math.round(predictMatch(red_1, red_2, blue_1, blue_2) * 100 * 100)/100}% chance of winning`);
    }
}
