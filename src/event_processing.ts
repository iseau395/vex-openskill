import { rate, rating, ordinal, predictWin } from "npm:openskill";

import { AllianceColor, Event, Match } from "./robotevents-types.ts";
import { getMatches } from "./robotevents.ts";
import { getTeamsByEvents } from "./robotevents.ts";

const match_list = new Array<Match>();
const event_ids = new Array<number>();

export async function processEvent(event: Event, division_id?: number) {
    event_ids.push(event.id);

    async function processDivision(division_id: number) {
        const matches = getMatches(event.id, division_id);

        for await (const match of matches) {
            match_list.push(match);
            // processMatch(match);
        }
    }

    if (division_id) {
        await processDivision(division_id);
    } else {
        for (let i = 0; i < event.divisions?.length!; i++) {
            await processDivision(event.divisions![i].id!);
        }
    }
}

export async function pruneTeamsByRegion(region: string) {
    const teams = getTeamsByEvents(event_ids);
    const team_ids = new Array<number>();

    for await (const team of teams) {
        if (team.location?.region == region) {
            team_ids.push(team.id);
        }
    }

    os_teams.forEach((_, key) => {
        if (!team_ids.includes(key)) {
            os_teams.delete(key);
        }
    });
}

export function processMatches() {
    for (const match of match_list) {
        processMatch(match);
    }
}

type Options = NonNullable<Parameters<typeof rate>[1]>;

let os_settings: Options = {
    mu: 31 * 3,
    sigma: 31,
    // tau: 0.9,
    tau: 3,
    preventSigmaIncrease: false,
};
let mu_change = 0.001;
let sigma_change = 0;
const os_teams = new Map<number, ReturnType<typeof rating>>();
const team_last_match = new Map<number, number>();
const team_numbers = new Map<number, string>();

export function setOSSettings(settings: Partial<Options>) {
    os_settings = { ...os_settings, ...settings };
}
export function resetOS() {
    os_teams.clear();
    team_last_match.clear();
}
export function setSkillWalk(new_mu_change: number, new_sigma_change: number) {
    mu_change = new_mu_change;
    sigma_change = new_sigma_change;
}

export function processMatch(match: Match) {
    if (!event_ids.includes(match.event.id)) {
        event_ids.push(match.event.id);
    }

    if (match.id == 75411631) {
        return;
    }

    try {
        const red_alliance = match.alliances[0].color == AllianceColor.Red ? match.alliances[0] : match.alliances[1];
        const blue_alliance = match.alliances[0].color == AllianceColor.Blue ? match.alliances[0] : match.alliances[1];

        if (red_alliance.score == 0 || !blue_alliance.score || blue_alliance.score == 0 || !red_alliance.score || red_alliance.score == blue_alliance.score) {
            return;
        }

        const red_1 = red_alliance.teams[0]?.team;
        const red_2 = red_alliance.teams[1]?.team;
        const blue_1 = blue_alliance.teams[0]?.team;
        const blue_2 = blue_alliance.teams[1]?.team;

        if (!red_1 || !red_2 || !blue_1 || !blue_2) {
            return;
        }

        team_numbers.set(red_1.id, red_1.name);
        team_numbers.set(red_2.id, red_2.name);
        team_numbers.set(blue_1.id, blue_1.name);
        team_numbers.set(blue_2.id, blue_2.name);

        const os_red_1 = rating(os_teams.get(red_1.id), os_settings);
        const os_red_2 = rating(os_teams.get(red_2.id), os_settings);
        const os_blue_1 = rating(os_teams.get(blue_1.id), os_settings);
        const os_blue_2 = rating(os_teams.get(blue_2.id), os_settings);
        
        const match_start_time = match?.started ? Date.parse(match?.started!) : Date.parse(match?.scheduled!);

        if (match_start_time && !isNaN(match_start_time)) {
            const red_1_last_match_time = team_last_match.get(red_1.id) ?? match_start_time;
            if (red_1_last_match_time - match_start_time > 0) {
                os_red_1.sigma += sigma_change * (match_start_time - red_1_last_match_time) / (60 * 60 * 1000);
                os_red_1.mu += mu_change * (match_start_time - red_1_last_match_time) / (60 * 60 * 1000);
            }

            const red_2_last_match_time = team_last_match.get(red_2.id) ?? match_start_time;
            if (red_2_last_match_time - match_start_time > 0) {
                os_red_2.sigma += sigma_change * (match_start_time - red_2_last_match_time) / (60 * 60 * 1000);
                os_red_2.mu += mu_change * (match_start_time - red_2_last_match_time) / (60 * 60 * 1000);
            }

            const blue_1_last_match_time = team_last_match.get(blue_1.id) ?? match_start_time;
            if (blue_1_last_match_time - match_start_time > 0) {
                os_blue_1.sigma += sigma_change * (match_start_time - blue_1_last_match_time) / (60 * 60 * 1000);
                os_blue_1.mu += mu_change * (match_start_time - blue_1_last_match_time) / (60 * 60 * 1000);
            }

            const blue_2_last_match_time = team_last_match.get(blue_2.id) ?? match_start_time;
            if (blue_2_last_match_time - match_start_time > 0) {
                os_blue_2.sigma += sigma_change * (match_start_time - blue_2_last_match_time) / (60 * 60 * 1000);
                os_blue_2.mu += mu_change * (match_start_time - blue_2_last_match_time) / (60 * 60 * 1000);
            }

            team_last_match.set(red_1.id, match_start_time);
            team_last_match.set(red_2.id, match_start_time);
            team_last_match.set(blue_1.id, match_start_time);
            team_last_match.set(blue_2.id, match_start_time);
        }

        const [
            [new_os_red_1, new_os_red_2],
            [new_os_blue_1, new_os_blue_2]
        ] = rate(
            [[os_red_1, os_red_2], [os_blue_1, os_blue_2]],
            {
                score: [red_alliance.score, blue_alliance.score],
                ...os_settings
            }
        );

        if (isNaN(ordinal(new_os_red_1)) || isNaN(ordinal(new_os_red_2)) || isNaN(ordinal(new_os_blue_1)) || isNaN(ordinal(new_os_blue_2))) {
            console.log(`OS NaN after runing rate, ignoring result. Match: ${match}`);
            return;
        }

        os_teams.set(red_1.id, new_os_red_1);
        os_teams.set(red_2.id, new_os_red_2);
        os_teams.set(blue_1.id, new_os_blue_1);
        os_teams.set(blue_2.id, new_os_blue_2);
    } catch (err) {
        console.log(`${err} on match: ${match.event.id}, ${match.id}`);
    }
}

export function predictMatch(red_1: string, red_2: string, blue_1: string, blue_2: string) {
    function getByValue<K, V>(map: Map<K, V>, searchValue: V): K | null {
        for (const [key, value] of map.entries()) {
            if (value === searchValue)
                return key;
        };

        return null;
    }

    const red_1_id = getByValue(team_numbers, red_1);
    const red_2_id = getByValue(team_numbers, red_2);
    const blue_1_id = getByValue(team_numbers, blue_1);
    const blue_2_id = getByValue(team_numbers, blue_2);

    if (!red_1_id || !red_2_id || !blue_1_id || !blue_2_id) {
        return -1;
    }

    const os_red_1 = rating(os_teams.get(red_1_id), os_settings);
    const os_red_2 = rating(os_teams.get(red_2_id), os_settings);
    const os_blue_1 = rating(os_teams.get(blue_1_id), os_settings);
    const os_blue_2 = rating(os_teams.get(blue_2_id), os_settings);

    const [red_chance, _blue_chance] = predictWin(
        [[os_red_1, os_red_2], [os_blue_1, os_blue_2]],
        os_settings
    );

    return red_chance;
}

export function logTeams(title: string, accuracy: number) {
    const teams = Array.from(os_teams.entries());

    teams.sort((a, b) => ordinal(b[1]) - ordinal(a[1]));

    const now = Date.now();

    const list = teams.map(
        (value, i) => 
            `${i + 1}, ${team_numbers.get(value[0])}, ${ordinal(
                {
                    mu: value[1].mu + mu_change * (now - (team_last_match.get(value[0]) ?? now)) / (60 * 60 * 1000),
                    sigma: value[1].sigma + sigma_change * (now - (team_last_match.get(value[0]) ?? now)) / (60 * 60 * 1000)
                })}`
    );

    console.log(`rank, team, skill\n${list.slice(0, 50).join("\n")}`);
    Deno.writeTextFile(`./rankings/${title} - (${Math.round(accuracy * 100 * 100) / 100}%).csv`, `rank, team, skill\n${list.join("\n")}`);
}

export function checkAccuracy() {
    let accurate = 0;

    for (const match of match_list) {
        try {
            const red_alliance = match.alliances[0].color == AllianceColor.Red ? match.alliances[0] : match.alliances[1];
            const blue_alliance = match.alliances[0].color == AllianceColor.Blue ? match.alliances[0] : match.alliances[1];

            if (red_alliance.score == 0 || blue_alliance.score == 0 || red_alliance.score == blue_alliance.score) {
                continue;
            }

            const red_1 = red_alliance.teams[0]?.team;
            const red_2 = red_alliance.teams[1]?.team;
            const blue_1 = blue_alliance.teams[0]?.team;
            const blue_2 = blue_alliance.teams[1]?.team;

            if (red_1?.name == "15442C" || red_2?.name == "15442C" || blue_1?.name == "15442C" || blue_2?.name == "15442C") {
                console.log(`${match.id}: ${red_1?.name}, ${red_2?.name} | ${blue_1?.name}, ${blue_2?.name}`);
            }

            if (!red_1 || !red_2 || !blue_1 || !blue_2) {
                continue;
            }

            const os_red_1 = rating(os_teams.get(red_1.id), os_settings);
            const os_red_2 = rating(os_teams.get(red_2.id), os_settings);
            const os_blue_1 = rating(os_teams.get(blue_1.id), os_settings);
            const os_blue_2 = rating(os_teams.get(blue_2.id), os_settings);

            const [red_chance, blue_chance] = predictWin(
                [[os_red_1, os_red_2], [os_blue_1, os_blue_2]],
                os_settings
            );

            if ((red_chance > blue_chance) == (red_alliance.score > blue_alliance.score)) {
                accurate++;
            }
        } catch (err) {
            console.log(`${err} on match: ${match.event.id}, ${match.id}`);
        }
    }

    return [accurate, match_list.length];
}

export async function saveMatches() {
    await Deno.writeTextFile("./matches.json", JSON.stringify(match_list));
}

export async function loadMatches() {
    match_list.length = 0;
    match_list.push(...JSON.parse(await Deno.readTextFile("./matches.json")) as Match[]);

    return match_list;
}