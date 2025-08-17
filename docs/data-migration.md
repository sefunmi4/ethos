# Client Data Migration

This project recently introduced a new payload structure for user profiles.
Legacy clients sent `username` and `bio` fields while the new format uses
`handle` and `about`.

To update your data:

1. Install dependencies and build the backend.
2. Prepare a JSON file with your user records in either legacy or new format.
3. Run the migration script:

```bash
cd ethos-backend
npx ts-node scripts/migrateUserData.ts path/to/users.json
```

The script translates legacy fields to the new format and sends them to the
`PUT /api/users/:id` endpoint for persistence.
