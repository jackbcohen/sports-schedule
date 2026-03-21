const express = require("express");

const app = express();

// --- Team lookup table ---
// Nested by league. TEAMS env var uses "league_team" format, e.g. "nba_nuggets".
const TEAM_LOOKUP = {
  nba: {
    hawks: { sport: "basketball", league: "nba", id: "1" },
    celtics: { sport: "basketball", league: "nba", id: "2" },
    nets: { sport: "basketball", league: "nba", id: "17" },
    hornets: { sport: "basketball", league: "nba", id: "30" },
    bulls: { sport: "basketball", league: "nba", id: "4" },
    cavaliers: { sport: "basketball", league: "nba", id: "5" },
    cavs: { sport: "basketball", league: "nba", id: "5" },
    mavericks: { sport: "basketball", league: "nba", id: "6" },
    mavs: { sport: "basketball", league: "nba", id: "6" },
    nuggets: { sport: "basketball", league: "nba", id: "7" },
    pistons: { sport: "basketball", league: "nba", id: "8" },
    warriors: { sport: "basketball", league: "nba", id: "9" },
    rockets: { sport: "basketball", league: "nba", id: "10" },
    pacers: { sport: "basketball", league: "nba", id: "11" },
    clippers: { sport: "basketball", league: "nba", id: "12" },
    lakers: { sport: "basketball", league: "nba", id: "13" },
    grizzlies: { sport: "basketball", league: "nba", id: "29" },
    heat: { sport: "basketball", league: "nba", id: "14" },
    bucks: { sport: "basketball", league: "nba", id: "15" },
    timberwolves: { sport: "basketball", league: "nba", id: "16" },
    wolves: { sport: "basketball", league: "nba", id: "16" },
    pelicans: { sport: "basketball", league: "nba", id: "3" },
    knicks: { sport: "basketball", league: "nba", id: "18" },
    thunder: { sport: "basketball", league: "nba", id: "25" },
    magic: { sport: "basketball", league: "nba", id: "19" },
    "76ers": { sport: "basketball", league: "nba", id: "20" },
    sixers: { sport: "basketball", league: "nba", id: "20" },
    suns: { sport: "basketball", league: "nba", id: "21" },
    blazers: { sport: "basketball", league: "nba", id: "22" },
    trailblazers: { sport: "basketball", league: "nba", id: "22" },
    kings: { sport: "basketball", league: "nba", id: "23" },
    spurs: { sport: "basketball", league: "nba", id: "24" },
    raptors: { sport: "basketball", league: "nba", id: "28" },
    jazz: { sport: "basketball", league: "nba", id: "26" },
    wizards: { sport: "basketball", league: "nba", id: "27" },
  },
  nfl: {
    cardinals: { sport: "football", league: "nfl", id: "22" },
    falcons: { sport: "football", league: "nfl", id: "1" },
    ravens: { sport: "football", league: "nfl", id: "33" },
    bills: { sport: "football", league: "nfl", id: "2" },
    panthers: { sport: "football", league: "nfl", id: "29" },
    bears: { sport: "football", league: "nfl", id: "3" },
    bengals: { sport: "football", league: "nfl", id: "4" },
    browns: { sport: "football", league: "nfl", id: "5" },
    cowboys: { sport: "football", league: "nfl", id: "6" },
    broncos: { sport: "football", league: "nfl", id: "7" },
    lions: { sport: "football", league: "nfl", id: "8" },
    packers: { sport: "football", league: "nfl", id: "9" },
    texans: { sport: "football", league: "nfl", id: "34" },
    colts: { sport: "football", league: "nfl", id: "11" },
    jaguars: { sport: "football", league: "nfl", id: "30" },
    jags: { sport: "football", league: "nfl", id: "30" },
    chiefs: { sport: "football", league: "nfl", id: "12" },
    raiders: { sport: "football", league: "nfl", id: "13" },
    chargers: { sport: "football", league: "nfl", id: "24" },
    rams: { sport: "football", league: "nfl", id: "14" },
    dolphins: { sport: "football", league: "nfl", id: "15" },
    vikings: { sport: "football", league: "nfl", id: "16" },
    patriots: { sport: "football", league: "nfl", id: "17" },
    pats: { sport: "football", league: "nfl", id: "17" },
    saints: { sport: "football", league: "nfl", id: "18" },
    giants: { sport: "football", league: "nfl", id: "19" },
    jets: { sport: "football", league: "nfl", id: "20" },
    eagles: { sport: "football", league: "nfl", id: "21" },
    steelers: { sport: "football", league: "nfl", id: "23" },
    "49ers": { sport: "football", league: "nfl", id: "25" },
    niners: { sport: "football", league: "nfl", id: "25" },
    seahawks: { sport: "football", league: "nfl", id: "26" },
    buccaneers: { sport: "football", league: "nfl", id: "27" },
    bucs: { sport: "football", league: "nfl", id: "27" },
    titans: { sport: "football", league: "nfl", id: "10" },
    commanders: { sport: "football", league: "nfl", id: "28" },
  },
  nhl: {
    ducks: { sport: "hockey", league: "nhl", id: "25" },
    bruins: { sport: "hockey", league: "nhl", id: "1" },
    sabres: { sport: "hockey", league: "nhl", id: "2" },
    flames: { sport: "hockey", league: "nhl", id: "3" },
    hurricanes: { sport: "hockey", league: "nhl", id: "7" },
    blackhawks: { sport: "hockey", league: "nhl", id: "4" },
    avalanche: { sport: "hockey", league: "nhl", id: "17" },
    bluejackets: { sport: "hockey", league: "nhl", id: "29" },
    stars: { sport: "hockey", league: "nhl", id: "9" },
    redwings: { sport: "hockey", league: "nhl", id: "5" },
    oilers: { sport: "hockey", league: "nhl", id: "6" },
    panthers: { sport: "hockey", league: "nhl", id: "26" },
    kings: { sport: "hockey", league: "nhl", id: "8" },
    wild: { sport: "hockey", league: "nhl", id: "30" },
    canadiens: { sport: "hockey", league: "nhl", id: "10" },
    predators: { sport: "hockey", league: "nhl", id: "27" },
    devils: { sport: "hockey", league: "nhl", id: "11" },
    islanders: { sport: "hockey", league: "nhl", id: "12" },
    rangers: { sport: "hockey", league: "nhl", id: "13" },
    senators: { sport: "hockey", league: "nhl", id: "14" },
    flyers: { sport: "hockey", league: "nhl", id: "15" },
    penguins: { sport: "hockey", league: "nhl", id: "16" },
    sharks: { sport: "hockey", league: "nhl", id: "18" },
    kraken: { sport: "hockey", league: "nhl", id: "124292" },
    blues: { sport: "hockey", league: "nhl", id: "19" },
    lightning: { sport: "hockey", league: "nhl", id: "20" },
    mapleleafs: { sport: "hockey", league: "nhl", id: "21" },
    canucks: { sport: "hockey", league: "nhl", id: "22" },
    goldenknights: { sport: "hockey", league: "nhl", id: "37" },
    capitals: { sport: "hockey", league: "nhl", id: "23" },
    jets: { sport: "hockey", league: "nhl", id: "28" },
  },
  mlb: {
    diamondbacks: { sport: "baseball", league: "mlb", id: "29" },
    athletics: { sport: "baseball", league: "mlb", id: "11" },
    braves: { sport: "baseball", league: "mlb", id: "15" },
    orioles: { sport: "baseball", league: "mlb", id: "1" },
    redsox: { sport: "baseball", league: "mlb", id: "2" },
    cubs: { sport: "baseball", league: "mlb", id: "16" },
    whitesox: { sport: "baseball", league: "mlb", id: "4" },
    reds: { sport: "baseball", league: "mlb", id: "17" },
    guardians: { sport: "baseball", league: "mlb", id: "5" },
    rockies: { sport: "baseball", league: "mlb", id: "27" },
    tigers: { sport: "baseball", league: "mlb", id: "6" },
    astros: { sport: "baseball", league: "mlb", id: "18" },
    royals: { sport: "baseball", league: "mlb", id: "7" },
    angels: { sport: "baseball", league: "mlb", id: "3" },
    dodgers: { sport: "baseball", league: "mlb", id: "19" },
    marlins: { sport: "baseball", league: "mlb", id: "28" },
    brewers: { sport: "baseball", league: "mlb", id: "8" },
    twins: { sport: "baseball", league: "mlb", id: "9" },
    mets: { sport: "baseball", league: "mlb", id: "21" },
    yankees: { sport: "baseball", league: "mlb", id: "10" },
    phillies: { sport: "baseball", league: "mlb", id: "22" },
    pirates: { sport: "baseball", league: "mlb", id: "23" },
    padres: { sport: "baseball", league: "mlb", id: "25" },
    giants: { sport: "baseball", league: "mlb", id: "26" },
    mariners: { sport: "baseball", league: "mlb", id: "12" },
    cardinals: { sport: "baseball", league: "mlb", id: "24" },
    rays: { sport: "baseball", league: "mlb", id: "30" },
    rangers: { sport: "baseball", league: "mlb", id: "13" },
    bluejays: { sport: "baseball", league: "mlb", id: "14" },
    nationals: { sport: "baseball", league: "mlb", id: "20" },
  },
  mls: {
    atlanta_united: { sport: "soccer", league: "usa.1", id: "18418" },
    austin_fc: { sport: "soccer", league: "usa.1", id: "20906" },
    cf_montreal: { sport: "soccer", league: "usa.1", id: "9720" },
    charlotte_fc: { sport: "soccer", league: "usa.1", id: "21300" },
    chicago_fire: { sport: "soccer", league: "usa.1", id: "182" },
    colorado_rapids: { sport: "soccer", league: "usa.1", id: "184" },
    columbus_crew: { sport: "soccer", league: "usa.1", id: "183" },
    dc_united: { sport: "soccer", league: "usa.1", id: "193" },
    fc_cincinnati: { sport: "soccer", league: "usa.1", id: "18267" },
    fc_dallas: { sport: "soccer", league: "usa.1", id: "185" },
    houston_dynamo: { sport: "soccer", league: "usa.1", id: "6077" },
    inter_miami: { sport: "soccer", league: "usa.1", id: "20232" },
    la_galaxy: { sport: "soccer", league: "usa.1", id: "187" },
    lafc: { sport: "soccer", league: "usa.1", id: "18966" },
    minnesota_united: { sport: "soccer", league: "usa.1", id: "17362" },
    nashville_sc: { sport: "soccer", league: "usa.1", id: "18986" },
    new_england_revolution: { sport: "soccer", league: "usa.1", id: "189" },
    nycfc: { sport: "soccer", league: "usa.1", id: "17606" },
    orlando_city: { sport: "soccer", league: "usa.1", id: "12011" },
    philadelphia_union: { sport: "soccer", league: "usa.1", id: "10739" },
    portland_timbers: { sport: "soccer", league: "usa.1", id: "9723" },
    real_salt_lake: { sport: "soccer", league: "usa.1", id: "4771" },
    red_bull_new_york: { sport: "soccer", league: "usa.1", id: "190" },
    san_diego_fc: { sport: "soccer", league: "usa.1", id: "22529" },
    san_jose_earthquakes: { sport: "soccer", league: "usa.1", id: "191" },
    seattle_sounders: { sport: "soccer", league: "usa.1", id: "9726" },
    sporting_kc: { sport: "soccer", league: "usa.1", id: "186" },
    st_louis_city: { sport: "soccer", league: "usa.1", id: "21812" },
    toronto_fc: { sport: "soccer", league: "usa.1", id: "7318" },
    vancouver_whitecaps: { sport: "soccer", league: "usa.1", id: "9727" },
  },
  wnba: {
    dream: { sport: "basketball", league: "wnba", id: "20" },
    sky: { sport: "basketball", league: "wnba", id: "19" },
    sun: { sport: "basketball", league: "wnba", id: "18" },
    wings: { sport: "basketball", league: "wnba", id: "3" },
    valkyries: { sport: "basketball", league: "wnba", id: "129689" },
    fever: { sport: "basketball", league: "wnba", id: "5" },
    aces: { sport: "basketball", league: "wnba", id: "17" },
    sparks: { sport: "basketball", league: "wnba", id: "6" },
    lynx: { sport: "basketball", league: "wnba", id: "8" },
    liberty: { sport: "basketball", league: "wnba", id: "9" },
    mercury: { sport: "basketball", league: "wnba", id: "11" },
    fire: { sport: "basketball", league: "wnba", id: "132052" },
    storm: { sport: "basketball", league: "wnba", id: "14" },
    tempo: { sport: "basketball", league: "wnba", id: "131935" },
    mystics: { sport: "basketball", league: "wnba", id: "16" },
  },
};

// --- Startup validation ---
if (!process.env.TEAMS) {
  console.error("Error: TEAMS is required. Example: TEAMS=nba_nuggets,nfl_broncos");
  process.exit(1);
}
if (!process.env.TZ) {
  console.error("Error: TZ is required. Example: TZ=America/New_York");
  process.exit(1);
}

// --- Location lookup table ---
// Maps city_<name> and state_<name> prefixes to arrays of "league_team" strings.
// Normalized: lowercase, spaces stripped before matching.
const LOCATION_LOOKUP = {
  // US Cities
  city_atlanta: ["nba_hawks", "nfl_falcons", "mlb_braves", "mls_atlanta_united", "wnba_dream"],
  city_austin: ["mls_austin_fc"],
  city_baltimore: ["nfl_ravens", "mlb_orioles"],
  city_boston: ["nba_celtics", "nfl_patriots", "nhl_bruins", "mlb_redsox", "mls_new_england_revolution"],
  city_buffalo: ["nfl_bills", "nhl_sabres"],
  city_charlotte: ["nba_hornets", "nfl_panthers", "mls_charlotte_fc"],
  city_chicago: ["nba_bulls", "nfl_bears", "nhl_blackhawks", "mlb_cubs", "mlb_whitesox", "mls_chicago_fire", "wnba_sky"],
  city_cincinnati: ["nfl_bengals", "mlb_reds", "mls_fc_cincinnati"],
  city_cleveland: ["nba_cavaliers", "nfl_browns", "mlb_guardians"],
  city_columbus: ["nhl_bluejackets", "mls_columbus_crew"],
  city_dallas: ["nba_mavericks", "nfl_cowboys", "nhl_stars", "mlb_rangers", "mls_fc_dallas", "wnba_wings"],
  city_denver: ["nba_nuggets", "nfl_broncos", "nhl_avalanche", "mlb_rockies", "mls_colorado_rapids"],
  city_detroit: ["nba_pistons", "nfl_lions", "nhl_redwings", "mlb_tigers"],
  city_greenbay: ["nfl_packers"],
  city_houston: ["nba_rockets", "nfl_texans", "mlb_astros", "mls_houston_dynamo"],
  city_indianapolis: ["nba_pacers", "nfl_colts", "wnba_fever"],
  city_jacksonville: ["nfl_jaguars"],
  city_kansascity: ["nfl_chiefs", "mlb_royals", "mls_sporting_kc"],
  city_lasvegas: ["nfl_raiders", "nhl_goldenknights", "mlb_athletics", "wnba_aces"],
  city_losangeles: ["nba_lakers", "nba_clippers", "nfl_rams", "nfl_chargers", "mlb_dodgers", "mlb_angels", "nhl_kings", "nhl_ducks", "mls_la_galaxy", "mls_lafc", "wnba_sparks"],
  city_memphis: ["nba_grizzlies"],
  city_miami: ["nba_heat", "nfl_dolphins", "nhl_panthers", "mlb_marlins", "mls_inter_miami"],
  city_milwaukee: ["nba_bucks", "mlb_brewers"],
  city_minneapolis: ["nba_timberwolves", "nfl_vikings", "nhl_wild", "mlb_twins", "mls_minnesota_united", "wnba_lynx"],
  city_nashville: ["nfl_titans", "nhl_predators", "mls_nashville_sc"],
  city_newjersey: ["nhl_devils"],
  city_neworleans: ["nba_pelicans", "nfl_saints"],
  city_newyork: ["nba_knicks", "nba_nets", "nfl_giants", "nfl_jets", "mlb_yankees", "mlb_mets", "nhl_rangers", "nhl_islanders", "mls_nycfc", "mls_red_bull_new_york", "wnba_liberty"],
  city_oklahomacity: ["nba_thunder"],
  city_orlando: ["nba_magic", "mls_orlando_city"],
  city_philadelphia: ["nba_76ers", "nfl_eagles", "nhl_flyers", "mlb_phillies", "mls_philadelphia_union"],
  city_phoenix: ["nba_suns", "nfl_cardinals", "mlb_diamondbacks", "wnba_mercury"],
  city_pittsburgh: ["nfl_steelers", "nhl_penguins", "mlb_pirates"],
  city_portland: ["nba_blazers", "mls_portland_timbers", "wnba_fire"],
  city_raleigh: ["nhl_hurricanes"],
  city_sacramento: ["nba_kings"],
  city_saltlakecity: ["nba_jazz", "mls_real_salt_lake"],
  city_sanantonio: ["nba_spurs"],
  city_sandiego: ["mlb_padres", "mls_san_diego_fc"],
  city_sanfrancisco: ["nba_warriors", "nfl_49ers", "nhl_sharks", "mlb_giants", "mls_san_jose_earthquakes", "wnba_valkyries"],
  city_seattle: ["nfl_seahawks", "nhl_kraken", "mlb_mariners", "mls_seattle_sounders", "wnba_storm"],
  city_stlouis: ["nhl_blues", "mlb_cardinals", "mls_st_louis_city"],
  city_tampa: ["nfl_buccaneers", "nhl_lightning", "mlb_rays"],
  city_washington: ["nba_wizards", "nfl_commanders", "nhl_capitals", "mlb_nationals", "mls_dc_united", "wnba_mystics"],
  // Canadian Cities
  city_calgary: ["nhl_flames"],
  city_edmonton: ["nhl_oilers"],
  city_montreal: ["nhl_canadiens", "mls_cf_montreal"],
  city_ottawa: ["nhl_senators"],
  city_toronto: ["nba_raptors", "nhl_mapleleafs", "mlb_bluejays", "mls_toronto_fc", "wnba_tempo"],
  city_vancouver: ["nhl_canucks", "mls_vancouver_whitecaps"],
  city_winnipeg: ["nhl_jets"],
  // US States
  state_arizona: ["nba_suns", "nfl_cardinals", "mlb_diamondbacks", "wnba_mercury"],
  state_california: ["nba_lakers", "nba_clippers", "nba_warriors", "nba_kings", "nfl_rams", "nfl_chargers", "nfl_49ers", "mlb_dodgers", "mlb_angels", "mlb_giants", "mlb_padres", "nhl_kings", "nhl_ducks", "nhl_sharks", "mls_la_galaxy", "mls_lafc", "mls_san_jose_earthquakes", "mls_san_diego_fc", "wnba_sparks", "wnba_valkyries"],
  state_colorado: ["nba_nuggets", "nfl_broncos", "nhl_avalanche", "mlb_rockies", "mls_colorado_rapids"],
  state_florida: ["nba_heat", "nba_magic", "nfl_dolphins", "nfl_buccaneers", "nfl_jaguars", "nhl_panthers", "nhl_lightning", "mlb_marlins", "mlb_rays", "mls_inter_miami", "mls_orlando_city"],
  state_georgia: ["nba_hawks", "nfl_falcons", "mlb_braves", "mls_atlanta_united", "wnba_dream"],
  state_illinois: ["nba_bulls", "nfl_bears", "nhl_blackhawks", "mlb_cubs", "mlb_whitesox", "mls_chicago_fire", "wnba_sky"],
  state_indiana: ["nba_pacers", "nfl_colts", "wnba_fever"],
  state_louisiana: ["nba_pelicans", "nfl_saints"],
  state_maryland: ["nfl_ravens", "nfl_commanders", "mlb_orioles"],
  state_massachusetts: ["nba_celtics", "nfl_patriots", "nhl_bruins", "mlb_redsox"],
  state_michigan: ["nba_pistons", "nfl_lions", "nhl_redwings", "mlb_tigers"],
  state_minnesota: ["nba_timberwolves", "nfl_vikings", "nhl_wild", "mlb_twins", "mls_minnesota_united", "wnba_lynx"],
  state_missouri: ["nfl_chiefs", "nhl_blues", "mlb_royals", "mlb_cardinals", "mls_sporting_kc", "mls_st_louis_city"],
  state_nevada: ["nfl_raiders", "nhl_goldenknights", "mlb_athletics", "wnba_aces"],
  state_newjersey: ["nfl_giants", "nfl_jets", "nhl_devils"],
  state_newyork: ["nba_knicks", "nba_nets", "nfl_giants", "nfl_jets", "nfl_bills", "mlb_yankees", "mlb_mets", "nhl_rangers", "nhl_islanders", "nhl_sabres", "mls_nycfc", "mls_red_bull_new_york", "wnba_liberty"],
  state_northcarolina: ["nba_hornets", "nfl_panthers", "nhl_hurricanes", "mls_charlotte_fc"],
  state_ohio: ["nba_cavaliers", "nfl_browns", "nfl_bengals", "nhl_bluejackets", "mlb_guardians", "mlb_reds", "mls_columbus_crew", "mls_fc_cincinnati"],
  state_oklahoma: ["nba_thunder"],
  state_oregon: ["nba_blazers", "mls_portland_timbers", "wnba_fire"],
  state_pennsylvania: ["nba_76ers", "nfl_eagles", "nfl_steelers", "nhl_flyers", "nhl_penguins", "mlb_phillies", "mlb_pirates"],
  state_tennessee: ["nba_grizzlies", "nfl_titans", "nhl_predators", "mls_nashville_sc"],
  state_texas: ["nba_mavericks", "nba_rockets", "nba_spurs", "nfl_cowboys", "nfl_texans", "mlb_rangers", "mlb_astros", "mls_fc_dallas", "mls_houston_dynamo", "mls_austin_fc", "wnba_wings"],
  state_utah: ["nba_jazz", "mls_real_salt_lake"],
  state_washington: ["nfl_seahawks", "nhl_kraken", "mlb_mariners", "mls_seattle_sounders", "wnba_storm"],
  state_wisconsin: ["nba_bucks", "nfl_packers", "mlb_brewers"],
};

// --- Configuration ---
const themeSetting = (process.env.THEME || "dark").toLowerCase();
const config = {
  port: parseInt(process.env.PORT || "6597", 10),
  refreshHours: parseInt(process.env.REFRESH_HOURS || "6", 10),
  gameCount: parseInt(process.env.GAME_COUNT || "20", 10),
  tz: process.env.TZ,
  bgColor: process.env.BG_COLOR || (themeSetting === "light" ? "#f5f5f5" : "#1a1a2e"),
  theme: themeSetting,
  layout: (process.env.LAYOUT || "default").toLowerCase(),
  width: process.env.WIDTH || null,
};

// Parse TEAMS env var into resolved team configs
// Format: "league_team" e.g. "nba_nuggets,nfl_broncos,nhl_avalanche,mlb_rockies"
// Also supports location prefixes: "city_denver", "state_colorado"
function parseTeams() {
  const raw = process.env.TEAMS.toLowerCase();
  const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const teams = [];
  const allAvailable = [];
  for (const [league, leagueTeams] of Object.entries(TEAM_LOOKUP)) {
    for (const team of Object.keys(leagueTeams)) {
      allAvailable.push(`${league}_${team}`);
    }
  }

  for (const input of names) {
    // Check for location prefix (city_xxx or state_xxx)
    if (input.startsWith("city_") || input.startsWith("state_")) {
      const normalized = input.replace(/\s+/g, "");
      const locationTeams = LOCATION_LOOKUP[normalized];
      if (!locationTeams) {
        console.warn(`Unknown location "${input}". Check LOCATION_LOOKUP for valid city_/state_ names.`);
        continue;
      }
      for (const teamStr of locationTeams) {
        const sepIdx = teamStr.indexOf("_");
        const league = teamStr.substring(0, sepIdx);
        const team = teamStr.substring(sepIdx + 1);
        const entry = TEAM_LOOKUP[league]?.[team];
        if (entry) teams.push({ name: teamStr, ...entry });
      }
      continue;
    }

    // Existing league_team logic (keep unchanged)
    const sepIdx = input.indexOf("_");
    if (sepIdx === -1) {
      console.warn(`Invalid team format "${input}" — use "league_team" format (e.g. nba_nuggets). Available: ${allAvailable.join(", ")}`);
      continue;
    }
    const league = input.substring(0, sepIdx);
    const team = input.substring(sepIdx + 1);
    const leagueTable = TEAM_LOOKUP[league];
    if (!leagueTable) {
      console.warn(`Unknown league "${league}" in "${input}". Available leagues: ${Object.keys(TEAM_LOOKUP).join(", ")}`);
      continue;
    }
    const entry = leagueTable[team];
    if (!entry) {
      console.warn(`Unknown team "${team}" in league "${league}". Available: ${Object.keys(leagueTable).join(", ")}`);
      continue;
    }
    teams.push({ name: input, ...entry });
  }
  if (teams.length === 0) {
    console.error(`Error: No valid teams resolved from TEAMS="${process.env.TEAMS}". Check team names against TEAM_LOOKUP.`);
    process.exit(1);
  }
  return teams;
}

const teams = parseTeams();
const multiTeam = teams.length > 1;

// --- HTML escaping ---
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Color utilities ---
function hexToRgb(hex) {
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Relative luminance per WCAG
function luminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Given ESPN color + alternateColor (hex without #), return { dark, light }
const validHex = /^[0-9a-fA-F]{3,6}$/;
function pickColors(color, alternateColor) {
  const fallbackDark = "2a2a4a";
  const fallbackLight = "ffffff";
  if (color && !validHex.test(color)) color = null;
  if (alternateColor && !validHex.test(alternateColor)) alternateColor = null;
  if (!color && !alternateColor) return { dark: fallbackDark, light: fallbackLight };
  if (!alternateColor) return { dark: color, light: fallbackLight };
  if (!color) return { dark: fallbackDark, light: alternateColor };

  const lumA = luminance(hexToRgb(color));
  const lumB = luminance(hexToRgb(alternateColor));
  if (lumA <= lumB) {
    return { dark: color, light: alternateColor };
  }
  return { dark: alternateColor, light: color };
}

// --- Per-team cache ---
const caches = {};

function cacheIsValid(teamName) {
  const c = caches[teamName];
  if (!c || !c.fetchedAt) return false;
  return Date.now() - c.fetchedAt < config.refreshHours * 60 * 60 * 1000;
}

// --- ESPN season helper ---
// NBA/NHL: cross-year season, ESPN uses the later year (2025-26 = 2026)
// NFL: single-year season, ESPN uses the year the season starts (Sep 2025 = 2025)
// MLB: calendar-year season
function getCurrentSeason(league) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (league === "nfl") {
    return month >= 2 ? year : year - 1;
  }
  if (league === "mlb" || league === "usa.1" || league === "wnba") {
    return year;
  }
  // NBA and NHL: cross-year
  return month < 7 ? year : year + 1;
}

// --- Retry helper ---
async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt < retries) {
        const delay = (attempt + 1) * 1000;
        console.log(`  Retry ${attempt + 1}/${retries} for ${url} in ${delay}ms (${err.message})`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// --- API fetching ---
async function fetchTeamData(team) {
  const base = `https://site.api.espn.com/apis/site/v2/sports/${team.sport}/${team.league}/teams/${team.id}`;
  const season = getCurrentSeason(team.league);
  const start = Date.now();
  console.log(`Fetching ${team.name} (${team.league}/${team.id}, season ${season})...`);

  const [teamRes, scheduleRes] = await Promise.all([
    fetchWithRetry(base),
    fetchWithRetry(`${base}/schedule?season=${season}`),
  ]);

  const [teamJson, scheduleJson] = await Promise.all([
    teamRes.json(),
    scheduleRes.json(),
  ]);

  const teamInfo = teamJson.team;
  const displayName = teamInfo.displayName;
  const logo = teamInfo.logos?.[0]?.href || null;
  const colors = pickColors(teamInfo.color, teamInfo.alternateColor);
  const record = teamInfo.record?.items?.find((i) => i.type === "total")?.summary || null;

  const knownNetworks = [
    "Altitude", "ESPN", "NBA", "NBC", "CBS", "ABC", "FOX", "Prime", "Peacock",
    "TNT", "NFL Network", "NHL Network", "MLB Network", "TBS", "truTV", "FS1",
  ];

  // Build cutoff for completed games: today at 10 AM, or yesterday at 10 AM if before 10 AM
  const now = new Date();
  const todayCutoff = new Date(now);
  todayCutoff.setHours(10, 0, 0, 0);
  const cutoff = now < todayCutoff
    ? new Date(todayCutoff.getTime() - 24 * 60 * 60 * 1000)
    : todayCutoff;

  const games = (scheduleJson.events || [])
    .filter((e) => {
      const status = e.competitions?.[0]?.status?.type?.name;
      return status === "STATUS_SCHEDULED" || status === "STATUS_IN_PROGRESS" || status === "STATUS_FINAL";
    })
    .map((e) => {
      const comp = e.competitions[0];
      const competitors = comp.competitors;
      const home = competitors.find((c) => c.homeAway === "home");
      const away = competitors.find((c) => c.homeAway === "away");
      const isHome = home.team.id === team.id;
      const statusType = comp.status?.type?.name;
      const statusDetail = comp.status?.type?.shortDetail || null;

      const broadcasts = comp.broadcasts || [];
      const allNames = broadcasts.map((b) => b.media?.shortName).filter(Boolean);
      const broadcast = allNames.find((name) => knownNetworks.some((k) => name.includes(k))) || null;

      return {
        id: e.id,
        date: e.date,
        homeTeam: home.team.displayName,
        awayTeam: away.team.displayName,
        opponent: isHome ? away.team.displayName : home.team.displayName,
        isHome,
        venue: comp.venue ? comp.venue.fullName : null,
        broadcast,
        teamName: team.name,
        teamDisplayName: displayName,
        league: team.league.toUpperCase(),
        colors,
        logo,
        status: statusType,
        statusDetail,
        homeScore: home.score?.displayValue || null,
        awayScore: away.score?.displayValue || null,
        homeLogo: home.team.logo?.href || null,
        awayLogo: away.team.logo?.href || null,
        week: e.week?.number || null,
      };
    })
    .filter((g) => {
      // Filter out completed games before the cutoff
      if (g.status === "STATUS_FINAL" && new Date(g.date) < cutoff) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // NFL bye week detection
  if (team.league === "nfl") {
    const regularSeasonGames = games.filter((g) => g.week && !g.isBye);
    if (regularSeasonGames.length > 0) {
      const playedWeeks = new Set(regularSeasonGames.map((g) => g.week));
      for (let w = 1; w <= 18; w++) {
        if (!playedWeeks.has(w)) {
          // Estimate bye date from surrounding games
          const beforeGames = regularSeasonGames.filter((g) => g.week < w);
          const afterGames = regularSeasonGames.filter((g) => g.week > w);
          let byeDate;
          if (beforeGames.length > 0 && afterGames.length > 0) {
            const before = new Date(beforeGames[beforeGames.length - 1].date);
            const after = new Date(afterGames[0].date);
            byeDate = new Date((before.getTime() + after.getTime()) / 2);
          } else if (afterGames.length > 0) {
            byeDate = new Date(new Date(afterGames[0].date).getTime() - 7 * 24 * 60 * 60 * 1000);
          } else if (beforeGames.length > 0) {
            byeDate = new Date(new Date(beforeGames[beforeGames.length - 1].date).getTime() + 7 * 24 * 60 * 60 * 1000);
          } else {
            continue;
          }

          // Only show bye week if it's not in the past (before cutoff)
          if (byeDate < cutoff) continue;

          games.push({
            id: `bye-${team.id}-${w}`,
            date: byeDate.toISOString(),
            isBye: true,
            week: w,
            teamName: team.name,
            teamDisplayName: displayName,
            league: "NFL",
            colors,
            logo,
            status: "BYE",
          });
        }
      }
      // Re-sort after adding bye weeks
      games.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }

  const elapsed = Date.now() - start;
  const scheduled = games.filter((g) => g.status === "STATUS_SCHEDULED").length;
  const live = games.filter((g) => g.status === "STATUS_IN_PROGRESS").length;
  const final = games.filter((g) => g.status === "STATUS_FINAL").length;
  const byes = games.filter((g) => g.isBye).length;
  console.log(`  ${displayName}: ${games.length} games (${scheduled} scheduled, ${live} live, ${final} final${byes ? `, ${byes} bye` : ""}) record=${record || "n/a"} [${elapsed}ms]`);

  return { games, displayName, logo, colors, record };
}

async function getTeamData(team) {
  if (cacheIsValid(team.name) && caches[team.name]?.games) {
    const c = caches[team.name];
    const age = Math.round((Date.now() - c.fetchedAt) / 60000);
    console.log(`Cache hit for ${team.name} (${age}m old, ${c.games.length} games)`);
    return { games: c.games, displayName: c.displayName, logo: c.logo, colors: c.colors, record: c.record, fetchedAt: c.fetchedAt, teamName: team.name, error: null };
  }

  try {
    const { games, displayName, logo, colors, record } = await fetchTeamData(team);
    caches[team.name] = { games, displayName, logo, colors, record, fetchedAt: Date.now(), error: null };
    return { games, displayName, logo, colors, record, fetchedAt: Date.now(), teamName: team.name, error: null };
  } catch (err) {
    console.error(`Failed to fetch ${team.name}:`, err.message);
    const c = caches[team.name];
    if (c?.games) {
      console.log(`  Serving stale cache for ${team.name} (${c.games.length} games)`);
      return { games: c.games, displayName: c.displayName, logo: c.logo, colors: c.colors, record: c.record, fetchedAt: c.fetchedAt, teamName: team.name, error: err.message };
    }
    return { games: null, displayName: null, logo: null, colors: null, record: null, fetchedAt: null, teamName: null, error: err.message };
  }
}

async function getAllTeamData() {
  const results = await Promise.all(teams.map((t) => getTeamData(t)));
  const allGames = [];
  let anyError = null;
  let oldestFetch = null;
  const teamMeta = [];

  for (const r of results) {
    if (r.error) anyError = r.error;
    if (r.fetchedAt && (!oldestFetch || r.fetchedAt < oldestFetch)) {
      oldestFetch = r.fetchedAt;
    }
    if (r.games) allGames.push(...r.games);
    if (r.displayName) {
      teamMeta.push({ teamName: r.teamName, displayName: r.displayName, logo: r.logo, colors: r.colors, record: r.record });
    }
  }

  allGames.sort((a, b) => new Date(a.date) - new Date(b.date));
  const limited = allGames.slice(0, config.gameCount);
  return {
    games: limited.length > 0 ? limited : null,
    allGamesUnsliced: allGames.length > 0 ? allGames : null,
    teamMeta,
    fetchedAt: oldestFetch,
    error: anyError,
  };
}

// --- Startup health gate ---
let healthy = false;

// --- Routes ---

app.get("/health", (_req, res) => {
  if (!healthy) {
    return res.status(503).json({ status: "warming" });
  }
  res.json({ status: "ok" });
});

app.get("/api/games", async (_req, res) => {
  console.log("GET /api/games");
  try {
    const data = await getAllTeamData();
    const count = data.games ? data.games.length : 0;
    console.log(`  → ${count} games returned`);
    res.json(data);
  } catch (err) {
    console.error("Error in /api/games:", err.message);
    res.status(500).json({ error: "Failed to load game data" });
  }
});

app.get("/api/glance", async (_req, res) => {
  console.log("GET /api/glance");
  try {
    const { games } = await getAllTeamData();
    const items = (games || []).map((g) => {
      const isLive = g.status === "STATUS_IN_PROGRESS";
      const isFinal = g.status === "STATUS_FINAL";
      const isBye = g.isBye;

      let title, time, status, score;

      if (isBye) {
        title = "BYE WEEK";
        time = `Week ${g.week}`;
        status = "bye";
        score = null;
      } else {
        const gameDate = new Date(g.date);
        const datePart = gameDate.toLocaleDateString("en-US", {
          timeZone: config.tz,
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const timePart = gameDate.toLocaleTimeString("en-US", {
          timeZone: config.tz,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        title = `${g.awayTeam} @ ${g.homeTeam}`;

        if (isLive) {
          time = g.statusDetail || "LIVE";
          status = "live";
          score = (g.awayScore != null && g.homeScore != null) ? `${g.awayScore}-${g.homeScore}` : null;
        } else if (isFinal) {
          time = "Final";
          status = "final";
          score = (g.awayScore != null && g.homeScore != null) ? `${g.awayScore}-${g.homeScore}` : null;
        } else {
          time = `${datePart} · ${timePart}`;
          status = "scheduled";
          score = null;
        }
      }

      return {
        title,
        time,
        league: g.league || "",
        broadcast: (!g.isBye && g.status !== "STATUS_FINAL" && g.broadcast) ? g.broadcast : "",
        status,
        score,
      };
    });

    res.json({ games: items });
  } catch (err) {
    console.error("Error in /api/glance:", err.message);
    res.status(500).json({ error: "Failed to load game data" });
  }
});

app.get("/", async (_req, res) => {
  const start = Date.now();
  console.log("GET /");
  try {
    const { games, allGamesUnsliced, teamMeta, fetchedAt, error } = await getAllTeamData();
    const count = games ? games.length : 0;
    console.log(`  → Rendering ${count} games for ${teamMeta.length} team(s) [${Date.now() - start}ms]`);
    res.type("html").send(renderWidget(games, allGamesUnsliced, teamMeta, fetchedAt, error));
  } catch (err) {
    console.error("Error in /:", err.message);
    res.type("html").send(renderWidget(null, null, [], null, err.message));
  }
});

// --- Container width helper ---
function getContainerWidth() {
  if (config.width) {
    if (config.width === "full") return "100%";
    return `${parseInt(config.width, 10)}px`;
  }
  if (config.layout === "default" || config.layout === "compact") return "420px";
  return "100%";
}

// --- Theme colors ---
function getThemeColors() {
  if (config.theme === "light") {
    return {
      text: "#1a1a1a",
      muted: "rgba(0,0,0,0.45)",
      border: "rgba(0,0,0,0.08)",
      pillBg: "rgba(0,0,0,0.06)",
      pillText: "rgba(0,0,0,0.6)",
      footer: "rgba(0,0,0,0.3)",
      timeText: "rgba(0,0,0,0.75)",
      errorText: "rgba(0,0,0,0.5)",
    };
  }
  return {
    text: "#ffffff",
    muted: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.07)",
    pillBg: "rgba(255,255,255,0.08)",
    pillText: "rgba(255,255,255,0.7)",
    footer: "rgba(255,255,255,0.25)",
    timeText: "rgba(255,255,255,0.85)",
    errorText: "rgba(255,255,255,0.5)",
  };
}

// --- HTML rendering ---

function renderWidget(games, allGamesUnsliced, teamMeta, fetchedAt, error) {
  const t = getThemeColors();

  const rawGameRows = games
    ? games.map((g) => renderGame(g, t)).join("")
    : `<div class="error">Unable to load schedule</div>`;

  const gameRows = config.layout === "horizontal" && games
    ? `<div class="horizontal-container">${rawGameRows}</div>`
    : rawGameRows;

  const finalGameRows = config.layout === "columns" && multiTeam
    ? renderColumns(allGamesUnsliced, teamMeta, t)
    : gameRows;

  const lastUpdated = fetchedAt
    ? new Date(fetchedAt).toLocaleString("en-US", {
        timeZone: config.tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        month: "short",
        day: "numeric",
      })
    : "never";

  // Single-team mode: use team branding
  const singleTeam = !multiTeam && teamMeta.length === 1 ? teamMeta[0] : null;
  const accentColor = singleTeam ? `#${singleTeam.colors.light}` : "#8888aa";
  const recordStr = singleTeam?.record ? ` (${esc(singleTeam.record)})` : "";
  const title = singleTeam ? `${esc(singleTeam.displayName)}${recordStr} Upcoming` : "Upcoming Games";
  const logoHtml = singleTeam?.logo
    ? `<img class="team-logo" src="${esc(singleTeam.logo)}" alt="">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: ${config.bgColor};
    color: ${t.text};
    min-height: 100vh;
  }
  .container {
    max-width: ${getContainerWidth()};
    margin: 0 auto;
    padding: 12px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0 8px;
    border-bottom: 2px solid ${accentColor};
    margin-bottom: 8px;
  }
  .team-logo {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
  .header h1 {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${accentColor};
  }
  .game {
    padding: 10px 12px;
    border-bottom: 1px solid ${t.border};
    border-radius: ${multiTeam ? "6px" : "0"};
    ${multiTeam ? "margin-bottom: 4px;" : ""}
    position: relative;
  }
  .game-date {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .game-main {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .matchup {
    font-size: 15px;
    font-weight: 500;
  }
  .inline-logo {
    width: 16px;
    height: 16px;
    object-fit: contain;
    vertical-align: middle;
    margin-right: 2px;
  }
  .time {
    font-size: 12px;
    font-weight: 600;
    color: ${t.timeText};
    white-space: nowrap;
    background: ${t.pillBg};
    padding: 2px 8px;
    border-radius: 4px;
  }
  .venue {
    font-size: 11px;
    color: ${t.muted};
    margin-top: 1px;
  }
  .league-pill {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 1px 6px;
    border-radius: 3px;
    background: ${t.pillBg};
    color: ${t.pillText};
    margin-right: 6px;
    vertical-align: middle;
  }
  .footer {
    text-align: center;
    padding: 10px 0 4px;
    font-size: 10px;
    color: ${t.footer};
  }
  .error {
    padding: 24px 12px;
    text-align: center;
    color: ${t.errorText};
    font-size: 13px;
  }
  .game-live {
    padding: 14px 12px;
  }
  .game-live .matchup {
    font-size: 17px;
  }
  .game-final {
    opacity: 0.7;
  }
  .score-bold {
    font-weight: 700;
  }
  .bye-row {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${t.muted};
  }
  .compact .game {
    padding: 6px 10px;
  }
  .compact .matchup {
    font-size: 13px;
  }
  .compact .game-date {
    font-size: 10px;
  }
  .compact .time {
    font-size: 11px;
    padding: 1px 6px;
  }
  .compact .venue {
    display: none;
  }
  .horizontal-container {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
    align-items: flex-start;
    padding-bottom: 8px;
  }
  .horizontal-container .game {
    min-width: 220px;
    max-width: 220px;
    flex-shrink: 0;
    border-radius: 6px;
    border-bottom: none;
    margin-bottom: 0;
  }
  .horizontal-container .venue {
    display: none;
  }
  .columns-grid {
    display: grid;
    grid-template-columns: repeat(var(--col-count), 1fr);
    gap: 12px;
    align-items: start;
  }
  .columns-panel {
    border-radius: 6px;
    overflow: hidden;
  }
  .columns-panel-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid;
    margin-bottom: 4px;
  }
  .columns-panel-header img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .columns-panel .game {
    border-radius: 0;
  }
</style>
</head>
<body>
<div class="container${config.layout === "compact" ? " compact" : ""}">
  <div class="header">
    ${logoHtml}
    <h1>${title}</h1>
  </div>
  ${finalGameRows}
  <div class="footer">
    Updated ${lastUpdated}${error ? " \u00b7 using cached data" : ""}
  </div>
</div>
<script>
  setTimeout(() => location.reload(), ${config.refreshHours * 60 * 60 * 1000});
</script>
</body>
</html>`;
}

function renderGame(game, t) {
  // Bye week rendering
  if (game.isBye) {
    const lightColor = `#${game.colors.light}`;
    const darkColor = `#${game.colors.dark}`;
    const gameDate = new Date(game.date);
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: config.tz });
    const gameStr = gameDate.toLocaleDateString("en-CA", { timeZone: config.tz });
    const isToday = todayStr === gameStr;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: config.tz });
    const isTomorrow = gameStr === tomorrowStr;

    const dateLabel = isToday
      ? "TODAY"
      : isTomorrow
        ? "TOMORROW"
        : gameDate.toLocaleDateString("en-US", {
            timeZone: config.tz,
            weekday: "short",
            month: "short",
            day: "numeric",
          });

    const bgStyle = multiTeam ? `background: #${game.colors.dark}22;` : `background: ${lightColor}0A;`;

    return `
  <div class="game bye-row" style="${bgStyle} border-left: 3px solid ${lightColor}55; padding-left: 9px;">
    <div class="game-date" style="color:${lightColor}">${multiTeam ? `<span class="league-pill">NFL</span>` : ""}${dateLabel}</div>
    <div class="game-main">
      <span class="matchup" style="color:${t.muted}">BYE WEEK</span>
      <span class="time" style="opacity:0.5">Week ${game.week}</span>
    </div>
  </div>`;
  }

  const gameDate = new Date(game.date);
  const now = new Date();

  const todayStr = now.toLocaleDateString("en-CA", { timeZone: config.tz });
  const gameStr = gameDate.toLocaleDateString("en-CA", { timeZone: config.tz });
  const isToday = todayStr === gameStr;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: config.tz });
  const isTomorrow = gameStr === tomorrowStr;

  const dateLabel = isToday
    ? "TODAY"
    : isTomorrow
      ? "TOMORROW"
      : gameDate.toLocaleDateString("en-US", {
          timeZone: config.tz,
          weekday: "short",
          month: "short",
          day: "numeric",
        });

  const isLive = game.status === "STATUS_IN_PROGRESS";
  const isFinal = game.status === "STATUS_FINAL";

  // Time pill content
  let timePill;
  if (isLive) {
    timePill = esc(game.statusDetail || "LIVE");
  } else if (isFinal) {
    timePill = esc(game.statusDetail || "Final");
  } else {
    timePill = gameDate.toLocaleTimeString("en-US", {
      timeZone: config.tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const broadcastHtml = game.broadcast ? `<span>${esc(game.broadcast)}</span>` : null;
  const lightColor = `#${game.colors.light}`;
  const darkColor = `#${game.colors.dark}`;

  if (multiTeam) {
    // Multi-team: team-colored rows, league pill, full matchup with logos
    let matchup;
    if (isLive || isFinal) {
      const homeScoreBold = parseInt(game.homeScore) >= parseInt(game.awayScore);
      const awayScoreBold = parseInt(game.awayScore) >= parseInt(game.homeScore);
      const awayLogoHtml = game.awayLogo ? `<img class="inline-logo" src="${esc(game.awayLogo)}" alt="">` : "";
      const homeLogoHtml = game.homeLogo ? `<img class="inline-logo" src="${esc(game.homeLogo)}" alt="">` : "";
      const awayScoreHtml = game.awayScore ? ` <span class="${awayScoreBold && !homeScoreBold ? "score-bold" : ""}">${esc(game.awayScore)}</span>` : "";
      const homeScoreHtml = game.homeScore ? ` <span class="${homeScoreBold && !awayScoreBold ? "score-bold" : ""}">${esc(game.homeScore)}</span>` : "";
      matchup = `${awayLogoHtml}${esc(game.awayTeam)}${awayScoreHtml} @ ${homeLogoHtml}${esc(game.homeTeam)}${homeScoreHtml}`;
    } else {
      const awayLogoHtml = game.awayLogo ? `<img class="inline-logo" src="${esc(game.awayLogo)}" alt="">` : "";
      const homeLogoHtml = game.homeLogo ? `<img class="inline-logo" src="${esc(game.homeLogo)}" alt="">` : "";
      matchup = `${awayLogoHtml}${esc(game.awayTeam)} @ ${homeLogoHtml}${esc(game.homeTeam)}`;
    }

    const bgStyle = `background: #${game.colors.dark}33;`;
    const todayStyle = isToday ? `border-left: 3px solid ${lightColor}; padding-left: 9px;` : "";
    const liveStyle = isLive ? `border-left: 3px solid ${lightColor}; padding-left: 9px;` : "";
    const extraClass = isLive ? " game-live" : isFinal ? " game-final" : "";
    const accentStyle = isLive ? liveStyle : todayStyle;

    const details = [game.venue ? esc(game.venue) : null, broadcastHtml].filter(Boolean).join(" \u00b7 ");

    return `
  <div class="game${extraClass}" style="${bgStyle}${accentStyle}">
    <div class="game-date" style="color:${lightColor}"><span class="league-pill">${esc(game.league)}</span>${dateLabel}</div>
    <div class="game-main">
      <span class="matchup">${matchup}</span>
      <span class="time">${timePill}</span>
    </div>
    ${details ? `<div class="venue">${details}</div>` : ""}
  </div>`;
  }

  // Single-team mode
  let matchup;
  const prefix = game.isHome ? "vs" : "@";
  if (isLive || isFinal) {
    const myScore = game.isHome ? game.homeScore : game.awayScore;
    const oppScore = game.isHome ? game.awayScore : game.homeScore;
    const myBold = parseInt(myScore) >= parseInt(oppScore);
    const oppBold = parseInt(oppScore) >= parseInt(myScore);
    const myScoreHtml = myScore ? `<span class="${myBold && !oppBold ? "score-bold" : ""}">${esc(myScore)}</span>` : "";
    const oppScoreHtml = oppScore ? `<span class="${oppBold && !myBold ? "score-bold" : ""}">${esc(oppScore)}</span>` : "";
    matchup = `${prefix} ${esc(game.opponent)} ${oppScoreHtml}-${myScoreHtml}`;
  } else {
    matchup = `${prefix} ${esc(game.opponent)}`;
  }

  const extraClass = isLive ? " game-live" : isFinal ? " game-final" : "";
  const liveStyle = isLive ? `border-left: 3px solid ${lightColor}; background: ${lightColor}0F; padding-left: 9px;` : "";
  const todayHighlight = isToday && !isLive ? `border-left: 3px solid ${lightColor}; background: ${lightColor}0F; padding-left: 9px;` : "";
  const gameStyle = isLive ? liveStyle : todayHighlight;

  const details = [game.venue ? esc(game.venue) : null, broadcastHtml].filter(Boolean).join(" \u00b7 ");

  return `
  <div class="game${extraClass}" style="${gameStyle}">
    <div class="game-date" style="color:${lightColor}">${dateLabel}</div>
    <div class="game-main">
      <span class="matchup">${matchup}</span>
      <span class="time">${timePill}</span>
    </div>
    ${details ? `<div class="venue">${details}</div>` : ""}
  </div>`;
}

function renderColumns(allGamesUnsliced, teamMeta, t) {
  const teamOrder = teams.map((tm) => tm.name);
  const byTeam = {};
  for (const name of teamOrder) byTeam[name] = [];
  for (const g of (allGamesUnsliced || [])) {
    if (byTeam[g.teamName]) byTeam[g.teamName].push(g);
  }

  const colCount = teamOrder.length;
  const panels = teamOrder.map((teamName) => {
    const meta = teamMeta.find((m) => m.teamName === teamName);
    const teamGames = byTeam[teamName] || [];
    const limitedGames = teamGames.slice(0, config.gameCount);
    const lightColor = meta?.colors ? `#${meta.colors.light}` : "#8888aa";
    const logoHtml = meta?.logo ? `<img src="${esc(meta.logo)}" alt="">` : "";
    const displayName = meta?.displayName || teamGames[0]?.teamDisplayName || teamName;
    const gameRows = limitedGames.length > 0
      ? limitedGames.map((g) => renderGame(g, t)).join("")
      : `<div class="error" style="font-size:12px;padding:12px">No upcoming games</div>`;

    return `
  <div class="columns-panel">
    <div class="columns-panel-header" style="color:${lightColor}; border-color:${lightColor}">
      ${logoHtml}${esc(displayName)}
    </div>
    ${gameRows}
  </div>`;
  });

  return `<div class="columns-grid" style="--col-count:${colCount}">${panels.join("")}</div>`;
}

// --- Start ---
const teamList = teams.map((t) => t.name).join(", ");
app.listen(config.port, () => {
  console.log(`Sports widget running on :${config.port}`);
  console.log(`  Teams: ${teamList}`);
  console.log(`  Theme: ${config.theme}, BG: ${config.bgColor}`);
  console.log(`  Refresh: ${config.refreshHours}h, Max games: ${config.gameCount}, TZ: ${config.tz}`);
  console.log(`Warming cache...`);
  const warmStart = Date.now();
  getAllTeamData().then(({ games, teamMeta, error }) => {
    healthy = true;
    const count = games ? games.length : 0;
    console.log(`Cache warmed in ${Date.now() - warmStart}ms — ${count} games from ${teamMeta.length} team(s) — health check ready`);
  });
});
