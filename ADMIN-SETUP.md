# Soha Outfit — Admin Panel setup (Banglish)

Admin panel: https://sohaoutfit.github.io/admin.html

## A) GitHub Token banano + Admin-e login (ekbar-i)
1. Phone-er Chrome-e github.com kholo, **SohaOutfit** account-e login thako.
2. Ei link-e jao: https://github.com/settings/personal-access-tokens/new
3. **Token name:** soha-admin. **Expiration:** 1 year (ba "No expiration").
4. **Repository access:** "Only select repositories" -> **sohaoutfit.github.io** select koro.
5. **Permissions -> Repository permissions -> Contents:** "Read and write" dao.
6. Niche **Generate token** chapo -> `github_pat_...` token-ta **Copy** koro.
7. https://sohaoutfit.github.io/admin.html kholo -> token paste koro -> **Login** chapo.
   (Token shudhu tomar phone-er browser-e thake. Karo shathe share korbe na, Doraemon-keo na.)

## B) Order list-er jonno Google Sheet (ekbar-i, ~5 minute)
> Apps Script phone-e kholte Chrome menu (⋮) -> **Desktop site** on koro, othoba computer use koro.
1. https://sheets.new kholo -> notun Sheet hobe. Naam dao: **Soha Orders**.
2. Upore menu: **Extensions -> Apps Script**.
3. Jei code ache shob muche dao. Ei link-er shob code copy kore paste koro:
   https://raw.githubusercontent.com/SohaOutfit/sohaoutfit.github.io/main/apps-script/Code.gs
4. Upore **Save** (💾) chapo. Function list-e **setup** select kore **Run** chapo.
   - "Authorization required" -> **Review permissions** -> tomar Google account -> **Advanced** -> **Go to ... (unsafe)** -> **Allow**.
   (Eta tomar nijer script, tai Google "unverified" bole, bhoy nai.)
5. Sheet-e fire jao: **Settings** naame notun sheet hobe. **B1** ghore tomar **order password** likho (kamse kam 4 akkhor, nijer moto, karo ke bolbe na).
   Chaile **B2** ghore tomar email likho, notun order ashle email pabe.
6. Apps Script-e fire: **Deploy -> New deployment** -> ⚙️ -> **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   -> **Deploy** -> abar Allow chaile Allow -> **Web app URL** (`https://script.google.com/macros/s/.../exec`) **Copy** koro.
7. Admin panel -> **সেটিংস** tab -> URL paste -> **লিংক টেস্ট করুন** (✅ ashbe) -> **সেটিংস সেভ করুন**.
8. **অর্ডার** tab -> Settings sheet-er password dao -> order list dekhbe.

1–2 minute por site-e "অর্ডার কনফার্ম করুন" button chole ashbe. WhatsApp button-o thakbe backup hishebe.

## Code.gs pore bodlale
Deploy -> **Manage deployments** -> ✏️ -> Version: **New version** -> Deploy. (URL same thakbe.)
