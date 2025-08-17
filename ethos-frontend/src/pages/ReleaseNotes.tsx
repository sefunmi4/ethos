import React from 'react';

const ReleaseNotes: React.FC = () => (
  <main className="container mx-auto px-4 py-8 max-w-3xl text-primary bg-soft dark:bg-soft-dark">
    <h1 className="text-3xl font-bold mb-4">Data Format Update</h1>
    <p className="mb-4">
      We've introduced a new payload structure for user profiles. The API now
      accepts both the legacy fields (<code>username</code>, <code>bio</code>)
      and the new fields (<code>handle</code>, <code>about</code>). Existing
      clients will continue to work, but we recommend updating to the new
      format.
    </p>
    <p className="mb-4">
      See our migration guide in <code>docs/data-migration.md</code> or run the
      script in <code>ethos-backend/scripts/migrateUserData.ts</code> to convert
      your data.
    </p>
  </main>
);

export default ReleaseNotes;
