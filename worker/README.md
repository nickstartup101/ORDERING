# Staff push diagnostics

The diagnostic endpoints require the `PUSH_DIAGNOSTICS_TOKEN` Worker secret.
Set a long, unique token with Wrangler:

```sh
npx wrangler secret put PUSH_DIAGNOSTICS_TOKEN
```

Use the token only in an authorized operator's request:

```sh
curl -H "Authorization: Bearer $PUSH_DIAGNOSTICS_TOKEN" \
  https://<your-worker-domain>/api/push-status

curl -X POST -H "Authorization: Bearer $PUSH_DIAGNOSTICS_TOKEN" \
  https://<your-worker-domain>/api/test-push
```

`/api/push-status` checks Firebase OAuth and counts active Staff devices.
`/api/test-push` sends a test notification to every active Staff device. Neither
endpoint returns FCM device tokens or Firebase secrets.
