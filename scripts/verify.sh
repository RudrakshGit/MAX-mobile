#!/usr/bin/env bash
# Every rule the briefs assert is enforced here. Run before reporting any milestone done:
#   npm run verify
# A failing check is a real problem: fix the code, never weaken this script without the owner's OK.
set -u
cd "$(dirname "$0")/.."
fail=0
step() { echo "▶ $1"; }
bad()  { echo "  ✗ $1"; fail=1; }

step "typecheck"
npx tsc --noEmit || bad "typecheck failed"

step "unit tests"
npm test --silent >/tmp/max-verify-tests.log 2>&1 || { tail -30 /tmp/max-verify-tests.log; bad "unit tests failed"; }

step "crisis golden set never shrinks (>= 91 cases)"
n=$(node -e 'console.log(require("./src/safety/golden.json").length)')
[ "$n" -ge 91 ] || bad "golden set has $n cases"

step "crisis holdout set (fresh phrasings + everyday controls, added after the Oct 2026 audit) never shrinks (>= 79 cases)"
h=$(node -e 'console.log(require("./src/safety/holdout.json").length)')
[ "$h" -ge 79 ] || bad "holdout set has $h cases"

step "no native Alert dialogs (use showAlert from src/lib/dialog.tsx so dialogs match both themes)"
grep -rn "Alert\.alert(" src && bad "Alert.alert found (above)"

step "no secrets in source or config"
grep -rIlE "gsk_[A-Za-z0-9]{10,}|GROQ_API_KEY *=|postgres(ql)?://[^ \"']+:[^ \"']+@" src app.json eas.json 2>/dev/null && bad "secret-looking string found (above)"

step "AI provider called only from server code"
grep -rIl "api.groq.com" src | grep -vE "^src/(app/api/|safety/model-check\.ts|server/)" && bad "client code calls Groq directly (above)"

step "only EXPO_PUBLIC_API_URL may be public"
grep -rhoE "EXPO_PUBLIC_[A-Z_]+" src eas.json app.json 2>/dev/null | sort -u | grep -vxE "EXPO_PUBLIC_API_URL|EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" && bad "unexpected EXPO_PUBLIC_ variable (above)"

step "colours live only in src/lib/theme.ts"
grep -rInE "#[0-9A-Fa-f]{6}\b" src --include=*.ts --include=*.tsx | grep -vE "^src/lib/theme\.ts:|\.test\.ts:" && bad "hex colour outside theme.ts (above)"

step "fonts and icons imported by deep path"
grep -rInE "from ['\"](@expo/vector-icons|@expo-google-fonts/[a-z0-9-]+)['\"]" src && bad "package-index import bundles every weight/icon set (above)"

step "helplines still present"
grep -q "14416" src/lib/ui.tsx || bad "Tele-MANAS 14416 missing from the crisis card"

step "no logging inside API routes"
grep -rn "console.log" src/app/api && bad "console.log in an API route (use console.warn with reason codes only, never user text)"

step "decided-against dependencies stay out"
grep -qE "\"(lottie-react-native|@rive-app/[a-z-]+|rive-react-native|@shopify/react-native-skia|react-native-webview|react-native-confetti-cannon|react-native-purchases)\"" package.json && bad "a dependency the plan rejected was added"

step "third-party notices file exists"
[ -f THIRD-PARTY.md ] || bad "THIRD-PARTY.md missing"

if [ "$fail" -eq 0 ]; then echo "VERIFY: PASS"; else echo "VERIFY: FAIL"; fi
exit "$fail"
