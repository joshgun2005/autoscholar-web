import { db, schema } from "./db";

const { sharedReports } = schema;

async function resetShowcase() {
  try {
    console.log('🗑️  Réinitialisation du Showcase Communautaire...');
    console.log('');

    // Compter les rapports avant suppression
    const reportsBefore = await db.select().from(sharedReports);
    console.log(`📊 Nombre de rapports actuels: ${reportsBefore.length}`);
    console.log('');

    // Supprimer tous les rapports partagés
    await db.delete(sharedReports);

    console.log('✅ Showcase réinitialisé avec succès !');
    console.log(`   ${reportsBefore.length} analyses publiques ont été supprimées.`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

resetShowcase();
