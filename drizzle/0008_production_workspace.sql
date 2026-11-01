-- Retire public testing access. Preserve prior user-created records privately.
UPDATE orders SET deleted=1 WHERE workspace='blindspot-demo' AND id IN ('demo-order-0','demo-order-1','demo-order-2','demo-order-3','demo-order-4','demo-order-5','demo-order-6','demo-order-7','demo-order-8','demo-order-9','demo-order-10','demo-order-11');
--> statement-breakpoint
UPDATE workspaces SET settings=json_set(COALESCE(settings,'{}'),'$.publicReadOnly',json('false')) WHERE id='blindspot-demo';
--> statement-breakpoint
DELETE FROM sessions WHERE account IN (SELECT id FROM accounts WHERE demo=1);
