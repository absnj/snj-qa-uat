import * as fs from 'node:fs';

describe('UAT SMOKE', () => {
    it('launches to the login screen', async () => {
        try {
            // 'key' is the flutter-integration driver's ValueKey strategy.
            const loginBtn = await driver.waitUntil(
                async () => await driver.findElement('key', 'login_email_password_button').catch(() => null),
                { timeout: 20000, timeoutMsg: "no widget with ValueKey 'login_email_password_button' found" },
            );
            expect(loginBtn).toBeDefined();
        } catch (err) {
            // Dump what the flutter server sees so we can find the real keys.
            const tree = await driver.execute('flutter: renderTree');
            fs.writeFileSync('./render-tree.json', JSON.stringify(tree, null, 2));
            throw err;
        }
    });
});
