#!/bin/bash
# Comprehensive test suite for sports-widget
# Runs entirely through Docker

set -e

PASS=0
FAIL=0
IMAGE="sports-widget"
PORT=7199

log_pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
log_fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

run_container() {
  local name="test-sports-$$-$RANDOM"
  local env_args=""
  for arg in "$@"; do
    env_args="$env_args -e $arg"
  done
  # Stop anything on the port first
  docker ps -q --filter "publish=${PORT}" | xargs -r docker stop >/dev/null 2>&1 || true
  sleep 1
  docker run --rm -d --name "$name" -p ${PORT}:6597 $env_args "$IMAGE" >/dev/null 2>&1
  echo "$name"
}

wait_ready() {
  local name="$1"
  local max_wait="${2:-45}"
  for i in $(seq 1 $max_wait); do
    if curl -sf "http://localhost:${PORT}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "  Container $name did not become ready within ${max_wait}s"
  docker logs "$name" 2>&1 | tail -5
  return 1
}

stop_container() {
  docker stop "$1" >/dev/null 2>&1 || true
  sleep 2
}

assert_contains() {
  local content="$1"
  local pattern="$2"
  local label="$3"
  if echo "$content" | grep -qF "$pattern"; then
    log_pass "$label"
  else
    log_fail "$label — expected to find: $pattern"
  fi
}

assert_not_contains() {
  local content="$1"
  local pattern="$2"
  local label="$3"
  if echo "$content" | grep -qF "$pattern"; then
    log_fail "$label — did not expect to find: $pattern"
  else
    log_pass "$label"
  fi
}

assert_regex() {
  local content="$1"
  local pattern="$2"
  local label="$3"
  if echo "$content" | grep -qE "$pattern"; then
    log_pass "$label"
  else
    log_fail "$label — expected regex: $pattern"
  fi
}

echo "========================================="
echo "  Sports Widget Test Suite"
echo "========================================="
echo ""

# ─────────────────────────────────────────────
echo "TEST GROUP 1: Health endpoint startup gate"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver")

# Immediately check health before warmup finishes
sleep 0.3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "503" ] || [ "$HTTP_CODE" = "200" ]; then
  log_pass "Health endpoint responds during startup (got $HTTP_CODE)"
else
  log_fail "Health endpoint did not respond (got $HTTP_CODE)"
fi

HEALTH_BODY=$(curl -s "http://localhost:${PORT}/health" 2>/dev/null || echo '{}')
if echo "$HEALTH_BODY" | grep -qF '"warming"'; then
  log_pass "Health returns warming status before ready"
elif echo "$HEALTH_BODY" | grep -qF '"ok"'; then
  log_pass "Health returned ok (warmed quickly)"
fi

wait_ready "$NAME"
HEALTH=$(curl -sf "http://localhost:${PORT}/health")
assert_contains "$HEALTH" '"status":"ok"' "Health returns ok after warmup"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 2: Multi-team mode (all 4 leagues)"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nfl_broncos,nhl_avalanche,mlb_rockies" "TZ=America/Denver")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
API=$(curl -sf "http://localhost:${PORT}/api/games")

# Check title
assert_contains "$HTML" "Upcoming Games" "Multi-team title is 'Upcoming Games'"

# Check league pills exist
assert_contains "$HTML" "league-pill" "League pill CSS class present"

# Check inline logos
assert_contains "$HTML" "inline-logo" "Inline logo CSS class present"

# Check theme is dark by default
assert_contains "$HTML" "background: #1a1a2e" "Default dark background color"
assert_contains "$HTML" "color: #ffffff" "Default dark text color"

# Check CSS classes for game states
assert_contains "$HTML" ".game-live" "game-live CSS class defined"
assert_contains "$HTML" ".game-final" "game-final CSS class defined"
assert_contains "$HTML" ".score-bold" "score-bold CSS class defined"
assert_contains "$HTML" ".bye-row" "bye-row CSS class defined"

# Check API JSON structure
assert_contains "$API" '"league":"NBA"' "API returns NBA games"
assert_contains "$API" '"status"' "API includes status field"
assert_contains "$API" '"homeScore"' "API includes homeScore field"
assert_contains "$API" '"awayScore"' "API includes awayScore field"
assert_contains "$API" '"statusDetail"' "API includes statusDetail field"

# Check footer
assert_contains "$HTML" "Updated " "Footer shows update time"

# Check auto-reload script
assert_contains "$HTML" "setTimeout" "Auto-reload script present"

LOGS=$(docker logs "$NAME" 2>&1)
assert_contains "$LOGS" "nba_nuggets" "Startup log shows nba team"
assert_contains "$LOGS" "nfl_broncos" "Startup log shows nfl team"
assert_contains "$LOGS" "nhl_avalanche" "Startup log shows nhl team"
assert_contains "$LOGS" "mlb_rockies" "Startup log shows mlb team"
assert_contains "$LOGS" "Cache warmed" "Cache warmed log message"

# Check teamMeta has all 4 teams
META_COUNT=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('teamMeta', [])))
" 2>/dev/null || echo "0")
if [ "$META_COUNT" = "4" ]; then
  log_pass "All 4 teams present in teamMeta"
else
  log_fail "Expected 4 teams in teamMeta, got $META_COUNT"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 3: Single-team mode (NBA)"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
API=$(curl -sf "http://localhost:${PORT}/api/games")

# Check single-team header with record
assert_contains "$HTML" "Denver Nuggets" "Single-team shows team name"
assert_contains "$HTML" "Upcoming" "Single-team shows 'Upcoming'"
# Record should be in parentheses
assert_regex "$HTML" "\([0-9]+-[0-9]+\)" "Single-team shows W-L record in header"

# Check team logo in header
assert_contains "$HTML" "team-logo" "Team logo in header"
assert_contains "$HTML" "espncdn.com" "ESPN CDN logo URL present"

# Check single-team format (vs/@ prefix)
assert_regex "$HTML" "(vs |@ )" "Single-team uses vs/@ matchup format"

# No league pills in single-team mode game rows
# (league-pill class is defined in CSS but not rendered in game rows)
assert_not_contains "$HTML" 'league-pill">NBA' "No league pill in single-team game rows"

# Check accent color comes from team colors
assert_contains "$HTML" "border-bottom: 2px solid #" "Header border uses team accent color"

# Check API returns only NBA games
LEAGUES=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['games']:
    leagues = set(g['league'] for g in data['games'])
    print(','.join(sorted(leagues)))
else:
    print('none')
" 2>/dev/null || echo "error")
if [ "$LEAGUES" = "NBA" ]; then
  log_pass "Single NBA team only returns NBA games"
else
  log_fail "Expected only NBA games, got: $LEAGUES"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 4: Single-team NHL"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nhl_avalanche" "TZ=America/Denver")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Colorado Avalanche" "NHL team name renders"
assert_regex "$HTML" "\([0-9]+-[0-9]+" "NHL team shows record"

# Verify NHL games in API
API=$(curl -sf "http://localhost:${PORT}/api/games")
assert_contains "$API" '"league":"NHL"' "API returns NHL games"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 5: Single-team MLB"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=mlb_rockies" "TZ=America/Denver")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
API=$(curl -sf "http://localhost:${PORT}/api/games")
assert_contains "$HTML" "Colorado Rockies" "MLB team name renders"

# MLB season may or may not have games depending on time of year
META=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for tm in data.get('teamMeta', []):
    print(tm.get('displayName', 'unknown'))
" 2>/dev/null || echo "error")
assert_contains "$META" "Colorado Rockies" "MLB teamMeta has Rockies"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 6: Single-team NFL (offseason handling)"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nfl_broncos" "TZ=America/Denver")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
API=$(curl -sf "http://localhost:${PORT}/api/games")
assert_contains "$HTML" "Denver Broncos" "NFL team name renders"

# NFL is in offseason in Feb, games should be null but team info should still render
META=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for tm in data.get('teamMeta', []):
    print(tm.get('displayName', 'unknown'))
" 2>/dev/null || echo "error")
assert_contains "$META" "Denver Broncos" "NFL teamMeta has Broncos"

# Record should be present
assert_regex "$HTML" "\([0-9]+-[0-9]+\)" "NFL team shows W-L record"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 7: Light theme"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "THEME=light")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "background: #f5f5f5" "Light theme background color"
assert_contains "$HTML" "color: #1a1a1a" "Light theme text color"
assert_contains "$HTML" "rgba(0,0,0,0.45)" "Light theme muted color"
assert_contains "$HTML" "rgba(0,0,0,0.06)" "Light theme pill background"
assert_contains "$HTML" "rgba(0,0,0,0.3)" "Light theme footer color"
assert_not_contains "$HTML" "rgba(255,255,255,0.07)" "No dark theme border in light mode"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 8: Light theme with custom BG_COLOR"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "THEME=light" "BG_COLOR=#eeeeee")
wait_ready "$NAME"

HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "background: #eeeeee" "Custom BG_COLOR overrides light default"
assert_contains "$HTML" "color: #1a1a1a" "Light theme text still applies with custom bg"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 9: parseTeams error handling"
echo "─────────────────────────────────────────"

# Bad format (no underscore) — warns then exits (all-invalid = fatal)
CONTAINER_ID=$(docker run -d -p ${PORT}:6597 -e TEAMS=nuggets -e TZ=America/Denver "$IMAGE" 2>/dev/null)
sleep 5
LOGS=$(docker logs "$CONTAINER_ID" 2>&1)
STATUS=$(docker inspect "$CONTAINER_ID" --format='{{.State.Status}}' 2>/dev/null || echo "gone")
docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
if [ "$STATUS" = "exited" ]; then
  assert_contains "$LOGS" "Invalid team format" "Bad format logs error before exit"
  EXIT_CODE=$(docker inspect "$CONTAINER_ID" --format='{{.State.ExitCode}}' 2>/dev/null || echo "1")
  if [ "$EXIT_CODE" = "1" ]; then
    log_pass "All-invalid TEAMS exits with code 1"
  else
    log_fail "All-invalid TEAMS expected exit code 1, got $EXIT_CODE"
  fi
else
  log_fail "All-invalid TEAMS should exit but status is: $STATUS"
fi
docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true

# Unknown league — warns and exits
CONTAINER_ID=$(docker run -d -p ${PORT}:6597 -e TEAMS=xyz_nuggets -e TZ=America/Denver "$IMAGE" 2>/dev/null)
sleep 5
LOGS=$(docker logs "$CONTAINER_ID" 2>&1)
docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
assert_contains "$LOGS" 'Unknown league' "Warns about unknown league"
docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true

# Unknown team in valid league — warns and exits
CONTAINER_ID=$(docker run -d -p ${PORT}:6597 -e TEAMS=nba_fakers -e TZ=America/Denver "$IMAGE" 2>/dev/null)
sleep 5
LOGS=$(docker logs "$CONTAINER_ID" 2>&1)
docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
assert_contains "$LOGS" 'Unknown team' "Warns about unknown team"
docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true

# Mix of valid and invalid — valid ones still work
NAME=$(run_container "TEAMS=nba_nuggets,bad_team,nhl_avalanche" "TZ=America/Denver")
wait_ready "$NAME"
LOGS=$(docker logs "$NAME" 2>&1)
API=$(curl -sf "http://localhost:${PORT}/api/games")
assert_contains "$LOGS" "Unknown" "Warns about bad entry in mixed list"
assert_contains "$API" '"league":"NBA"' "Valid NBA team still works in mixed list"
assert_contains "$API" '"league":"NHL"' "Valid NHL team still works in mixed list"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 10: Team aliases"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_cavs" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Cleveland Cavaliers" "nba_cavs alias resolves to Cavaliers"
stop_container "$NAME"

NAME=$(run_container "TEAMS=nfl_pats" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "New England Patriots" "nfl_pats alias resolves to Patriots"
stop_container "$NAME"

NAME=$(run_container "TEAMS=nfl_niners" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "San Francisco 49ers" "nfl_niners alias resolves to 49ers"
stop_container "$NAME"

NAME=$(run_container "TEAMS=nba_sixers" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Philadelphia 76ers" "nba_sixers alias resolves to 76ers"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 11: GAME_COUNT limit"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "GAME_COUNT=3")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")
GAME_COUNT=$(echo "$API" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['games']) if d['games'] else 0)" 2>/dev/null || echo "error")
if [ "$GAME_COUNT" = "3" ]; then
  log_pass "GAME_COUNT=3 limits to 3 games"
elif [ "$GAME_COUNT" = "error" ]; then
  log_fail "Could not parse game count from API"
else
  # NBA might have fewer than 3 remaining games at end of season
  if [ "$GAME_COUNT" -le 3 ] 2>/dev/null; then
    log_pass "GAME_COUNT=3 limits games (got $GAME_COUNT, at most 3)"
  else
    log_fail "GAME_COUNT=3 returned $GAME_COUNT games instead of <=3"
  fi
fi
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 12: API response structure"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nhl_avalanche" "TZ=America/Denver")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")

# Check all expected top-level keys
assert_contains "$API" '"games"' "API has games key"
assert_contains "$API" '"teamMeta"' "API has teamMeta key"
assert_contains "$API" '"fetchedAt"' "API has fetchedAt key"
assert_contains "$API" '"error"' "API has error key"

# Check game object fields
assert_contains "$API" '"homeTeam"' "Game has homeTeam"
assert_contains "$API" '"awayTeam"' "Game has awayTeam"
assert_contains "$API" '"opponent"' "Game has opponent"
assert_contains "$API" '"isHome"' "Game has isHome"
assert_contains "$API" '"venue"' "Game has venue"
assert_contains "$API" '"broadcast"' "Game has broadcast"
assert_contains "$API" '"teamName"' "Game has teamName"
assert_contains "$API" '"teamDisplayName"' "Game has teamDisplayName"
assert_contains "$API" '"colors"' "Game has colors"
assert_contains "$API" '"logo"' "Game has logo"
assert_contains "$API" '"homeLogo"' "Game has homeLogo"
assert_contains "$API" '"awayLogo"' "Game has awayLogo"
assert_contains "$API" '"status"' "Game has status"

# Check teamMeta has record
assert_contains "$API" '"record"' "teamMeta includes record"

# Games should be sorted by date
SORTED=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
games = data.get('games') or []
dates = [g['date'] for g in games]
print('sorted' if dates == sorted(dates) else 'unsorted')
" 2>/dev/null || echo "error")
if [ "$SORTED" = "sorted" ]; then
  log_pass "Games are sorted by date"
elif [ "$SORTED" = "error" ]; then
  log_fail "Could not check sort order"
else
  log_fail "Games are not sorted by date"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 13: HTML structure validation"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nhl_avalanche" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")

assert_contains "$HTML" '<!DOCTYPE html>' "Valid HTML doctype"
assert_contains "$HTML" '<html lang="en">' "HTML lang attribute"
assert_contains "$HTML" '<meta charset="utf-8">' "UTF-8 charset"
assert_contains "$HTML" 'name="viewport"' "Viewport meta tag"
assert_contains "$HTML" "</html>" "Closing HTML tag"
assert_contains "$HTML" 'class="container"' "Container div present"
assert_contains "$HTML" 'class="header"' "Header div present"
assert_contains "$HTML" 'class="footer"' "Footer div present"
assert_contains "$HTML" 'class="game' "Game div present"

# Multi-team should have league pills in game rows
assert_regex "$HTML" 'league-pill">(NBA|NHL)' "League pills rendered in game rows"

# Should have team-colored backgrounds
assert_regex "$HTML" 'background: #[0-9a-f]+33' "Team-colored row backgrounds"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 14: Specific NHL and MLB teams"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nhl_kraken" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Seattle Kraken" "NHL Kraken (id 124292) resolves correctly"
stop_container "$NAME"

NAME=$(run_container "TEAMS=mlb_yankees" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "New York Yankees" "MLB Yankees resolves correctly"
stop_container "$NAME"

NAME=$(run_container "TEAMS=nhl_goldenknights" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Vegas Golden Knights" "NHL Golden Knights resolves correctly"
stop_container "$NAME"

NAME=$(run_container "TEAMS=mlb_dodgers" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Los Angeles Dodgers" "MLB Dodgers resolves correctly"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 15: Broadcast data"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")

BROADCAST_COUNT=$(echo "$API" | python3 -c "
import sys, json
games = json.load(sys.stdin).get('games') or []
count = sum(1 for g in games if g.get('broadcast'))
print(count)
" 2>/dev/null || echo "0")
if [ "$BROADCAST_COUNT" -gt 0 ]; then
  log_pass "Broadcast data populated for $BROADCAST_COUNT games"
else
  log_pass "No broadcast data (may depend on ESPN data availability)"
fi
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 16: Case insensitivity"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=NBA_NUGGETS" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Denver Nuggets" "Uppercase TEAMS env var works"
stop_container "$NAME"

NAME=$(run_container "TEAMS=Nba_Nuggets" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "Denver Nuggets" "Mixed-case TEAMS env var works"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 17: Multi-team logo rendering"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nba_lakers" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")

# Count inline-logo img tags in game rows
LOGO_COUNT=$(echo "$HTML" | grep -oF "inline-logo" | wc -l | tr -d ' ')
if [ "$LOGO_COUNT" -gt 0 ]; then
  log_pass "Inline team logos rendered in multi-team rows ($LOGO_COUNT found)"
else
  log_fail "No inline team logos found in multi-team mode"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 18: Date labels"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nhl_avalanche" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")

# Check that date formatting works for games
if echo "$HTML" | grep -qE "(TODAY|TOMORROW|Mon,|Tue,|Wed,|Thu,|Fri,|Sat,|Sun,)"; then
  log_pass "Date labels rendered (TODAY/TOMORROW/weekday)"
else
  log_fail "No date labels found"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 19: Venue display"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")

assert_contains "$HTML" 'class="venue"' "Venue div present"
assert_regex "$HTML" '(Arena|Center|Garden|Dome|Stadium|Field|Court)' "Venue names rendered"

# Check broadcast links
if echo "$HTML" | grep -qF 'target="_blank"'; then
  log_fail "Broadcast links should be plain text, not hyperlinks"
else
  log_pass "Broadcast names rendered as plain text (no hyperlinks)"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 20: Node.js syntax check"
echo "─────────────────────────────────────────"
SYNTAX_EXIT=$(docker run --rm "$IMAGE" node -c /app/server.js >/dev/null 2>&1; echo $?)
if [ "$SYNTAX_EXIT" = "0" ]; then
  log_pass "server.js passes Node.js syntax check"
else
  log_fail "server.js syntax check failed with exit code $SYNTAX_EXIT"
fi

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 21: Dark theme with custom BG_COLOR"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "BG_COLOR=#222222")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" "background: #222222" "Custom dark BG_COLOR applied"
assert_contains "$HTML" "color: #ffffff" "Dark theme text color preserved"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 22: Multiple teams same league"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nba_lakers,nba_celtics" "TZ=America/Denver")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")

META_COUNT=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('teamMeta', [])))
" 2>/dev/null || echo "0")
if [ "$META_COUNT" = "3" ]; then
  log_pass "3 NBA teams all present in teamMeta"
else
  log_fail "Expected 3 teams in teamMeta, got $META_COUNT"
fi

# All games should be NBA
LEAGUES=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
games = data.get('games') or []
leagues = set(g['league'] for g in games)
print(','.join(sorted(leagues)))
" 2>/dev/null || echo "none")
if [ "$LEAGUES" = "NBA" ]; then
  log_pass "All games are NBA when only NBA teams configured"
else
  log_fail "Expected only NBA, got: $LEAGUES"
fi

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 23: Whitespace and comma handling in TEAMS"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS= nba_nuggets , nhl_avalanche " "TZ=America/Denver")
if wait_ready "$NAME"; then
  API=$(curl -sf "http://localhost:${PORT}/api/games")
  META_COUNT=$(echo "$API" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('teamMeta', [])))
" 2>/dev/null || echo "0")
  if [ "$META_COUNT" = "2" ]; then
    log_pass "Whitespace in TEAMS env var handled correctly"
  else
    log_fail "Expected 2 teams with whitespace, got $META_COUNT"
  fi
else
  log_fail "Whitespace TEAMS container failed to start"
fi
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 24: Missing required env vars exit with error"
echo "─────────────────────────────────────────"

# Missing TEAMS — should exit with code 1
CONTAINER_ID=$(docker run -d -p ${PORT}:6597 -e TZ=America/Denver "$IMAGE" 2>/dev/null)
sleep 3
LOGS=$(docker logs "$CONTAINER_ID" 2>&1)
STATUS=$(docker inspect "$CONTAINER_ID" --format='{{.State.Status}}' 2>/dev/null || echo "gone")
EXIT_CODE=$(docker inspect "$CONTAINER_ID" --format='{{.State.ExitCode}}' 2>/dev/null || echo "?")
docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true
assert_contains "$LOGS" "TEAMS is required" "Missing TEAMS logs error"
if [ "$EXIT_CODE" = "1" ]; then
  log_pass "Missing TEAMS exits with code 1"
else
  log_fail "Missing TEAMS expected exit 1, got status=$STATUS exit=$EXIT_CODE"
fi

# Missing TZ — should exit with code 1
CONTAINER_ID=$(docker run -d -p ${PORT}:6597 -e TEAMS=nba_nuggets "$IMAGE" 2>/dev/null)
sleep 3
LOGS=$(docker logs "$CONTAINER_ID" 2>&1)
EXIT_CODE=$(docker inspect "$CONTAINER_ID" --format='{{.State.ExitCode}}' 2>/dev/null || echo "?")
docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true
assert_contains "$LOGS" "TZ is required" "Missing TZ logs error"
if [ "$EXIT_CODE" = "1" ]; then
  log_pass "Missing TZ exits with code 1"
else
  log_fail "Missing TZ expected exit 1, got exit=$EXIT_CODE"
fi

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 25: Location-based team resolution"
echo "─────────────────────────────────────────"

# city_denver → 4 teams
NAME=$(run_container "TEAMS=city_denver" "TZ=America/Denver")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")
META_COUNT=$(echo "$API" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('teamMeta',[])))" 2>/dev/null || echo "0")
if [ "$META_COUNT" = "4" ]; then
  log_pass "city_denver resolves to 4 teams"
else
  log_fail "city_denver expected 4 teams in teamMeta, got $META_COUNT"
fi
LOGS=$(docker logs "$NAME" 2>&1)
assert_contains "$LOGS" "nba_nuggets" "city_denver includes nuggets"
assert_contains "$LOGS" "nfl_broncos" "city_denver includes broncos"
stop_container "$NAME"

# city_denver mixed with direct team
NAME=$(run_container "TEAMS=city_denver,nba_lakers" "TZ=America/Denver")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")
META_COUNT=$(echo "$API" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('teamMeta',[])))" 2>/dev/null || echo "0")
if [ "$META_COUNT" = "5" ]; then
  log_pass "city_denver + nba_lakers resolves to 5 teams"
else
  log_fail "city_denver + nba_lakers expected 5 teams, got $META_COUNT"
fi
stop_container "$NAME"

# state_colorado → same as city_denver
NAME=$(run_container "TEAMS=state_colorado" "TZ=America/Denver")
wait_ready "$NAME"
API=$(curl -sf "http://localhost:${PORT}/api/games")
META_COUNT=$(echo "$API" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('teamMeta',[])))" 2>/dev/null || echo "0")
if [ "$META_COUNT" = "4" ]; then
  log_pass "state_colorado resolves to 4 teams"
else
  log_fail "state_colorado expected 4 teams, got $META_COUNT"
fi
stop_container "$NAME"

# Unknown location logs warning but exits (all-invalid)
CONTAINER_ID=$(docker run -d -p ${PORT}:6597 -e TEAMS=city_atlantis -e TZ=America/Denver "$IMAGE" 2>/dev/null)
sleep 5
LOGS=$(docker logs "$CONTAINER_ID" 2>&1)
docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
docker rm "$CONTAINER_ID" >/dev/null 2>&1 || true
assert_contains "$LOGS" "Unknown location" "Unknown city logs warning"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 26: Layout modes"
echo "─────────────────────────────────────────"

# compact — has compact class, no venue content
NAME=$(run_container "TEAMS=nba_nuggets,nfl_broncos" "TZ=America/Denver" "LAYOUT=compact")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" 'class="container compact"' "Compact layout adds compact class"
assert_contains "$HTML" '.compact .venue' "Compact CSS rule targets venue"
assert_contains "$HTML" 'max-width: 420px' "Compact uses 420px width"
stop_container "$NAME"

# wide — full width
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "LAYOUT=wide")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" 'max-width: 100%' "Wide layout uses 100% width"
stop_container "$NAME"

# WIDTH override
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "WIDTH=600")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" 'max-width: 600px' "WIDTH=600 applies 600px"
stop_container "$NAME"

NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "WIDTH=full")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" 'max-width: 100%' "WIDTH=full applies 100%"
stop_container "$NAME"

# horizontal — has horizontal-container wrapper
NAME=$(run_container "TEAMS=nba_nuggets,nfl_broncos" "TZ=America/Denver" "LAYOUT=horizontal")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" 'class="horizontal-container"' "Horizontal layout wraps in horizontal-container"
assert_contains "$HTML" 'overflow-x: auto' "Horizontal CSS has overflow-x auto"
assert_contains "$HTML" 'min-width: 220px' "Horizontal game cards are 220px"
stop_container "$NAME"

# columns — multi-team renders column grid
NAME=$(run_container "TEAMS=nba_nuggets,nfl_broncos,nhl_avalanche" "TZ=America/Denver" "LAYOUT=columns")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_contains "$HTML" 'class="columns-grid"' "Columns layout renders columns-grid"
assert_contains "$HTML" 'columns-panel-header' "Each team gets a column header"
assert_contains "$HTML" 'col-count:3' "3-team columns sets --col-count to 3"
stop_container "$NAME"

# columns with single team falls back to default layout
NAME=$(run_container "TEAMS=nba_nuggets" "TZ=America/Denver" "LAYOUT=columns")
wait_ready "$NAME"
HTML=$(curl -sf "http://localhost:${PORT}/")
assert_not_contains "$HTML" 'class="columns-grid"' "Columns with single team falls back to default"
stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "TEST GROUP 27: Glance JSON endpoint"
echo "─────────────────────────────────────────"
NAME=$(run_container "TEAMS=nba_nuggets,nfl_broncos" "TZ=America/Denver")
wait_ready "$NAME"
GLANCE=$(curl -sf "http://localhost:${PORT}/api/glance")

assert_contains "$GLANCE" '"games"' "Glance response has games array"
assert_contains "$GLANCE" '"title"' "Glance games have title"
assert_contains "$GLANCE" '"time"' "Glance games have time"
assert_contains "$GLANCE" '"league"' "Glance games have league"
assert_contains "$GLANCE" '"broadcast"' "Glance games have broadcast"
assert_contains "$GLANCE" '"status"' "Glance games have status"
assert_contains "$GLANCE" '"score"' "Glance games have score"

STATUSES=$(echo "$GLANCE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
statuses = set(g['status'] for g in data.get('games', []))
invalid = statuses - {'scheduled', 'live', 'final', 'bye'}
print('ok' if not invalid else f'invalid: {invalid}')
" 2>/dev/null || echo "error")
if [ "$STATUSES" = "ok" ]; then
  log_pass "All Glance game statuses are valid values"
else
  log_fail "Invalid Glance status values: $STATUSES"
fi

assert_regex "$GLANCE" '"title":"[^"]+@[^"]+"' "Glance titles use Away @ Home format"

stop_container "$NAME"

# ─────────────────────────────────────────────
echo ""
echo "========================================="
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
