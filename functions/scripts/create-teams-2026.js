const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()
const firestoreRef = admin.firestore

const teams = [
  // ===== EAST REGION =====
  { stockName: 'Duke Blue Devils', seed: 1, bio: '32-2', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/150.png&transparent=true' },
  { stockName: 'UConn Huskies', seed: 2, bio: '29-5', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/41.png&transparent=true' },
  { stockName: 'Michigan State Spartans', seed: 3, bio: '25-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/127.png&transparent=true' },
  { stockName: 'Kansas Jayhawks', seed: 4, bio: '23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2305.png&transparent=true' },
  { stockName: "St. John's Red Storm", seed: 5, bio: '28-6', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2599.png&transparent=true' },
  { stockName: 'Louisville Cardinals', seed: 6, bio: '23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/97.png&transparent=true' },
  { stockName: 'UCLA Bruins', seed: 7, bio: '23-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/26.png&transparent=true' },
  { stockName: 'Ohio State Buckeyes', seed: 8, bio: '21-12', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/194.png&transparent=true' },
  { stockName: 'TCU Horned Frogs', seed: 9, bio: '22-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2628.png&transparent=true' },
  { stockName: 'UCF Knights', seed: 10, bio: '21-12', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2116.png&transparent=true' },
  { stockName: 'South Florida Bulls', seed: 11, bio: '22-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/58.png&transparent=true' },
  { stockName: 'Northern Iowa Panthers', seed: 12, bio: '24-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2460.png&transparent=true' },
  { stockName: 'California Baptist Lancers', seed: 13, bio: '24-9', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2856.png&transparent=true' },
  { stockName: 'North Dakota State Bison', seed: 14, bio: '25-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2449.png&transparent=true' },
  { stockName: 'Furman Paladins', seed: 15, bio: '24-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/231.png&transparent=true' },
  { stockName: 'Siena Saints', seed: 16, bio: '23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2561.png&transparent=true' },

  // ===== WEST REGION =====
  { stockName: 'Arizona Wildcats', seed: 1, bio: '32-2', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/12.png&transparent=true' },
  { stockName: 'Purdue Boilermakers', seed: 2, bio: '27-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2509.png&transparent=true' },
  { stockName: 'Gonzaga Bulldogs', seed: 3, bio: '30-3', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2250.png&transparent=true' },
  { stockName: 'Arkansas Razorbacks', seed: 4, bio: '26-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/8.png&transparent=true' },
  { stockName: 'Wisconsin Badgers', seed: 5, bio: '24-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/275.png&transparent=true' },
  { stockName: 'BYU Cougars', seed: 6, bio: '23-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/252.png&transparent=true' },
  { stockName: 'Miami Hurricanes', seed: 7, bio: '25-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2390.png&transparent=true' },
  { stockName: 'Villanova Wildcats', seed: 8, bio: '24-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/222.png&transparent=true' },
  { stockName: 'Utah State Aggies', seed: 9, bio: '27-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/328.png&transparent=true' },
  { stockName: 'Missouri Tigers', seed: 10, bio: '22-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/142.png&transparent=true' },
  // PLAY-IN: 11-seed West (Texas vs NC State — winner plays BYU)
  { stockName: 'Texas Longhorns / NC State Wolfpack', seed: 11, bio: '20-13 / 21-13', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/251.png&transparent=true' },
  { stockName: 'High Point Panthers', seed: 12, bio: '28-5', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2272.png&transparent=true' },
  { stockName: "Hawai'i Rainbow Warriors", seed: 13, bio: '22-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/62.png&transparent=true' },
  { stockName: 'Kennesaw State Owls', seed: 14, bio: '24-9', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/338.png&transparent=true' },
  { stockName: 'Queens University Royals', seed: 15, bio: '25-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2511.png&transparent=true' },
  { stockName: 'Long Island University Sharks', seed: 16, bio: '20-13', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/112358.png&transparent=true' },

  // ===== MIDWEST REGION =====
  { stockName: 'Michigan Wolverines', seed: 1, bio: '31-3', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/130.png&transparent=true' },
  { stockName: 'Iowa State Cyclones', seed: 2, bio: '27-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/66.png&transparent=true' },
  { stockName: 'Virginia Cavaliers', seed: 3, bio: '29-5', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/258.png&transparent=true' },
  { stockName: 'Alabama Crimson Tide', seed: 4, bio: '23-9', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/333.png&transparent=true' },
  { stockName: 'Texas Tech Red Raiders', seed: 5, bio: '22-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2641.png&transparent=true' },
  { stockName: 'Tennessee Volunteers', seed: 6, bio: '22-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2633.png&transparent=true' },
  { stockName: 'Kentucky Wildcats', seed: 7, bio: '21-13', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/96.png&transparent=true' },
  { stockName: 'Georgia Bulldogs', seed: 8, bio: '22-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/61.png&transparent=true' },
  { stockName: 'Saint Louis Billikens', seed: 9, bio: '23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/139.png&transparent=true' },
  { stockName: 'Santa Clara Broncos', seed: 10, bio: '24-9', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2541.png&transparent=true' },
  // PLAY-IN: 11-seed Midwest (SMU vs Miami OH — winner plays Tennessee)
  { stockName: 'SMU Mustangs / Miami (OH) RedHawks', seed: 11, bio: '20-14 / 21-12', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2567.png&transparent=true' },
  { stockName: 'Akron Zips', seed: 12, bio: '25-9', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2006.png&transparent=true' },
  { stockName: 'Hofstra Pride', seed: 13, bio: '26-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2275.png&transparent=true' },
  { stockName: 'Wright State Raiders', seed: 14, bio: '24-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2750.png&transparent=true' },
  { stockName: 'Tennessee State Tigers', seed: 15, bio: '21-12', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2634.png&transparent=true' },
  // PLAY-IN: 16-seed Midwest (UMBC vs Howard — winner plays Michigan)
  { stockName: 'UMBC Retrievers / Howard Bison', seed: 16, bio: '24-8 / 23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2378.png&transparent=true' },

  // ===== SOUTH REGION =====
  { stockName: 'Florida Gators', seed: 1, bio: '26-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/57.png&transparent=true' },
  { stockName: 'Houston Cougars', seed: 2, bio: '28-6', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/248.png&transparent=true' },
  { stockName: 'Illinois Fighting Illini', seed: 3, bio: '24-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/356.png&transparent=true' },
  { stockName: 'Nebraska Cornhuskers', seed: 4, bio: '26-6', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/158.png&transparent=true' },
  { stockName: 'Vanderbilt Commodores', seed: 5, bio: '26-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/238.png&transparent=true' },
  { stockName: 'North Carolina Tar Heels', seed: 6, bio: '24-8', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/153.png&transparent=true' },
  { stockName: "Saint Mary's Gaels", seed: 7, bio: '27-5', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2608.png&transparent=true' },
  { stockName: 'Clemson Tigers', seed: 8, bio: '24-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/228.png&transparent=true' },
  { stockName: 'Iowa Hawkeyes', seed: 9, bio: '21-13', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2294.png&transparent=true' },
  { stockName: 'Texas A&M Aggies', seed: 10, bio: '22-12', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/245.png&transparent=true' },
  { stockName: 'VCU Rams', seed: 11, bio: '23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2670.png&transparent=true' },
  { stockName: 'McNeese Cowboys', seed: 12, bio: '28-5', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2377.png&transparent=true' },
  { stockName: 'Troy Trojans', seed: 13, bio: '26-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2653.png&transparent=true' },
  { stockName: 'Pennsylvania Quakers', seed: 14, bio: '22-7', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/219.png&transparent=true' },
  { stockName: 'Idaho Vandals', seed: 15, bio: '23-10', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/70.png&transparent=true' },
  // PLAY-IN: 16-seed South (Prairie View A&M vs Lehigh — winner plays Florida)
  { stockName: 'Prairie View A&M Panthers / Lehigh Mountain Hawks', seed: 16, bio: '19-14 / 22-11', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2504.png&transparent=true' },
]

async function createTeams() {
  console.log(`Creating ${teams.length} stocks directly in Firestore...\n`)

  for (const team of teams) {
    const stockDoc = {
      price: 1,
      float: 0,
      stockName: team.stockName,
      bio: team.bio,
      dateCreated: firestoreRef.Timestamp.now(),
      ipoPrice: 1,
      seed: team.seed,
      currPoints: 0,
      imageUrl: team.imageUrl,
      gamesLeft: 6,
      hasLost: false,
      activeOrder: false,
    }

    const docRef = await db.collection('stocks').add(stockDoc)
    await docRef.update({ stockId: docRef.id })
    console.log(`Created: ${team.stockName} (${team.seed}-seed) [${docRef.id}]`)
  }

  console.log(`\nDone! Created ${teams.length} stocks.`)
}

createTeams()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err)
    process.exit(1)
  })
