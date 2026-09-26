const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function deleteCollection(collectionPath) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`Collection ${collectionPath} is already empty.`);
        return;
    }

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + 500);
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${Math.min(i + 500, docs.length)}/${docs.length} docs from ${collectionPath}`);
    }
}

async function resetForTournament() {
    console.log('=== March Madness Market 2026 Reset ===\n');

    // 1. Delete all stocks
    console.log('1. Deleting all stocks...');
    await deleteCollection('stocks');

    // 2. Delete all users and their ownedStocks subcollections
    console.log('\n2. Deleting all users and owned stocks...');
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        // Delete ownedStocks subcollection first
        const ownedStocksSnapshot = await db
            .collection('users')
            .doc(userDoc.id)
            .collection('ownedStocks')
            .get();

        if (!ownedStocksSnapshot.empty) {
            const ownedDocs = ownedStocksSnapshot.docs;
            for (let i = 0; i < ownedDocs.length; i += 500) {
                const batch = db.batch();
                const chunk = ownedDocs.slice(i, i + 500);
                chunk.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
        }

        // Delete user doc
        await userDoc.ref.delete();
        console.log(`  Deleted user: ${userDoc.id}`);
    }

    // 3. Delete leaderboard
    console.log('\n3. Resetting leaderboard...');
    await db.collection('leaderboard').doc('leaderboard').delete();

    // 4. Reset handledIds
    console.log('4. Resetting handledIds...');
    await db.collection('handledIds').doc('handledIds').set({
        handledIds: [],
        lastUpdated: '',
    });

    // 5. Delete Firebase Auth users
    console.log('\n5. Deleting Firebase Auth users...');
    let nextPageToken;
    let totalDeleted = 0;
    do {
        const listResult = await admin.auth().listUsers(1000, nextPageToken);
        if (listResult.users.length > 0) {
            const uids = listResult.users.map((u) => u.uid);
            // deleteUsers accepts max 1000 at a time
            await admin.auth().deleteUsers(uids);
            totalDeleted += uids.length;
            console.log(`  Deleted ${totalDeleted} auth users so far...`);
        }
        nextPageToken = listResult.pageToken;
    } while (nextPageToken);
    console.log(`  Total auth users deleted: ${totalDeleted}`);

    console.log('\n=== Reset complete! Ready for 2026 tournament. ===');
}

resetForTournament()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Reset failed:', err);
        process.exit(1);
    });
