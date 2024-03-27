import { load } from "https://deno.land/std@0.220.0/dotenv/mod.ts";
import { Match, Paginated } from "./robotevents-types.ts";
import { Event } from "./robotevents-types.ts";
import { EventLevel } from "./robotevents-types.ts";
export * from "./robotevents-types.ts";

const env = await load();

const BASE_URL = "https://robotevents.com/api/v2";
const ROBOTEVENTS_API_KEY = env["ROBOTEVENTS_API_KEY"];
const CURRENT_SEASON = 181;

function delay(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

let ratelimit_limit = 100;
let ratelimit_remaining = ratelimit_limit;
let stop = false;
let awaiting_request = false;
const request_queue: ((value?: unknown) => void)[] = [];
export async function requestRobotEvents<T extends unknown>(path: string, parameters?: { [key: string]: unknown }): Promise<T> {
    if (!parameters) {
        parameters = {};
    }

    if (stop) {
        throw new Error("request emergency stopped");
    }

    if (awaiting_request) {
        await new Promise(resolve => {
            request_queue.push(resolve);
        });
    }
    
    awaiting_request = true;

    if (ratelimit_remaining <= 1) {
        console.log("Hit timeout, waiting 60 seconds...");
        await delay(60_000);
    } else if (ratelimit_remaining < 10) {
        console.log("Approacing timeout, waiting 10 seconds...");
        await delay(10_000);
    }

    let url = BASE_URL + path;

    let is_first_parameter = true;
    for (const key in parameters) {
        if (is_first_parameter) {
            url += "?";
            is_first_parameter = false;
        } else {
            url += "&";
        }

        if (Array.isArray(parameters[key])) {
            for (let i = 0; i < (parameters[key] as unknown[]).length; i++) {
                if (i != 0) {
                    url += "&";
                }
                url += `${key}=${(parameters[key] as unknown[])[i]}`;
            }
        } else {
            url += `${key}=${parameters[key]}`;
        }
    }

    url = encodeURI(url);

    console.log(`GET: ${url}`);

    const response = await fetch(url, { headers: { "accept": "application/json", "Authorization": `Bearer ${ROBOTEVENTS_API_KEY}` } });
    ratelimit_limit = +(response.headers.get("x-ratelimit-limit") ?? ratelimit_limit);
    ratelimit_remaining = +(response.headers.get("x-ratelimit-remaining") ?? ratelimit_remaining - 1);
    
    console.log(`ratelimit: ${ratelimit_remaining}/${ratelimit_limit}`);

    if (request_queue.length > 0) {
        setTimeout(request_queue.shift()!, 10);
    } else {
        awaiting_request = false;
    }

    if (response.ok) {
        return response.json(); 
    } else {
        console.log(`error: ${response}`);
        if (response.status == 429) {
            ratelimit_remaining = 0;
            console.log(`Hit Timeout, retrying`);

            return await requestRobotEvents(path, parameters);
        } else {
            stop = true;
            throw new Error(`RobotEvents Error: ${response.status}, ${response.statusText}`);
        }
    }
}

const PER_PAGE = 250;

export async function* requestPaginated<T>(path: string, parameters?: { [key: string]: unknown }) {
    if (!parameters) {
        parameters = {};
    }

    parameters = { page: 1, per_page: PER_PAGE, ...parameters };

    let page = 1;
    let last_page = 1;
    
    let request = requestRobotEvents<Paginated<T>>(path, parameters);

    while (page <= last_page) {
        const response = await request;
        last_page = response.meta.last_page;

        page++;
        parameters["page"] = page;
        if (page <= last_page) {
            request = requestRobotEvents<Paginated<T>>(path, parameters);
        }

        const data = response.data;

        for (let i = 0; i < data.length; i++) {
            yield data[i];
        }
    }
}

export async function getEvent(sku: string) {
    return (await requestRobotEvents<Paginated<Event>>("/events", { "sku[]": sku, "myEvents": false })).data[0] ?? null;
}

export function getEventsRegion(before: Date, region: string) {
    return requestPaginated<Event>(`/events`, { "season[]": CURRENT_SEASON, "myEvents": false, end: before.toISOString(), region });
}

export function getSignatureEvents(before: Date) {
    return requestPaginated<Event>(`/events`, { "season[]": CURRENT_SEASON, "level[]": EventLevel.Signature, "myEvents": false, end: before.toISOString() });
}

export function getMatches(event_id: number, division_id: number) {
    return requestPaginated<Match>(`/events/${event_id}/divisions/${division_id}/matches`);
}