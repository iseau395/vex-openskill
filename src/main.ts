import { logTeams, processMatches, loadMatches, predictMatch, checkAccuracy } from "./event_processing.ts";

if (import.meta.main) {
    // const events = getEventsRegion(new Date(), "California - Region 4");
    // // const events = getSignatureEvents(new Date());
    // for await (const event of events) {
    //     if (event.level == EventLevel.Signature) continue; // skip over sigs if just processing a region to get rid of out-of-region teams
    //     await processEvent(event);
    // }

    await loadMatches(); // load cached matches from file

    for (let j = 0; j < 10; j++) {
        processMatches();
    }

    const [accurate, total] = checkAccuracy();
    logTeams("California - Region 4 Teams", `Accuracy: ${Math.round(accurate / total * 100 * 100) / 100}% (${accurate}/${total} matches guessed correct)`);
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
