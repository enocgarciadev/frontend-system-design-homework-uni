package api

import (
 "context"
 "database/sql"
 "embed"
 "fmt"
)

//go:embed db/*.sql
var migrations embed.FS

// Migrate is explicit: startup never silently resets or seeds user data.
func Migrate(ctx context.Context, db *sql.DB) error {
 tx, err := db.BeginTx(ctx, nil)
 if err != nil { return err }
 defer tx.Rollback()
 for _, file := range []string{"db/001_schema.sql", "db/002_seed.sql", "db/003_auth.sql"} {
  statement, err := migrations.ReadFile(file)
  if err != nil { return err }
  if _, err = tx.ExecContext(ctx, string(statement)); err != nil { return fmt.Errorf("%s: %w", file, err) }
 }
 return tx.Commit()
}
