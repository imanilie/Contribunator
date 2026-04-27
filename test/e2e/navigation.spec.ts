import { test, expect } from "@playwright/test";

import buildConfig from "@/lib/helpers/buildConfig";
import testConfig from "@/../test/configs/core.test.config";
import formTest from "@/../test/fixtures/form.fixture";

test("landing page and contribution list", async ({ page }) => {
  const { repos } = await buildConfig(await testConfig());
  await page.goto("/");
  // TODo replace with config title etc
  await expect(page).toHaveTitle("E2E C11R");
  await expect(page.getByText("E2E C11R")).toBeVisible();
  await page.getByText("Contribute").click();
  await expect(page.getByText("Select a Contribution Type")).toBeVisible();

  let first: any;
  for (const repo of Object.values(repos)) {
    const r = page.getByText(repo.title, { exact: true }).locator("..");
    await expect(r).toContainText(repo.description);
    await expect(r).toContainText(repo.githubUrl);
    for (const name of Object.keys(repo.contributions)) {
      const contribution = { ...repo.contributions[name], name };
      // hidden contributions should not be listed
      if (contribution.hidden) {
        await expect(r).not.toContainText(contribution.title);
      } else {
        if (!first) {
          first = { repo, contribution };
        }
        const c = r
          .getByText(contribution.title, { exact: true })
          .locator("..");
        await expect(c).toContainText(contribution.description);
      }
    }
  }
  // test that the first link navigates properly
  expect(first).toBeDefined();
  await page
    .getByText(first.contribution.title, { exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(
    `/contribute/${first.repo.name}/${first.contribution.name}`
  );
});

test("non-existent contribution shows not found page", async ({ page }) => {
  await page.goto("/contribute/_E2E_test/nonexistent_contribution");
  await expect(page.getByText("Page Not Found")).toBeVisible();
  await expect(
    page.getByText("Sorry, the resource you are looking for does not exist.")
  ).toBeVisible();
});

test("non-existent repo shows not found page", async ({ page }) => {
  await page.goto("/contribute/nonexistent_repo/some_contribution");
  await expect(page.getByText("Page Not Found")).toBeVisible();
  await expect(
    page.getByText("Sorry, the resource you are looking for does not exist.")
  ).toBeVisible();
});

const hiddenContributionTest = formTest({
  repo: "_E2E_test",
  contribution: "api",
});

hiddenContributionTest(
  "hidden contribution is accessible via direct url",
  async ({ f }) => {
    // The 'api' contribution in _E2E_test is hidden but should still be reachable
    await f.hasText("A Generic Contribution");
  }
);
