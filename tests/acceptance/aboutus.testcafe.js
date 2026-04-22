import { Selector, t } from 'testcafe';

fixture('About Us Page')
    .page('http://localhost:3000/aboutus');

test('About Us page loads', async t => {
    // Check for main heading
    const mainHeading = Selector('h1').withText('About Kitchen Coordinator');
    await t.expect(mainHeading.exists).ok('Expected main heading "About Kitchen Coordinator"');

    // Check for first secondary heading
    const subHeading1 = Selector('h2').withText('Why We Built It');
    await t.expect(subHeading1.exists).ok('Expected subheading "Why We Built It"');

    // Check for second secondary heading
    const subHeading2 = Selector('h2').withText('Looking Ahead');
    await t.expect(subHeading2.exists).ok('Expected subheading "Looking Ahead"');

    // Check for third secondary heading
    const subHeading3 = Selector('h2').withText('Learn More');
    await t.expect(subHeading3.exists).ok('Expected subheading "Learn More"');

    // Optional: check for logo image
    const logo = Selector('img').withAttribute('alt', 'Kitchen Coordinator Logo');
    await t.expect(logo.exists).ok('Expected logo image to be present');
});

test('Developement team section has correct links', async t => {
    // Check for GitHub link
    const githubLink = Selector('a').withText('Click to learn more about our development process and our team');
    await t.expect(githubLink.getAttribute('href')).eql('https://kitchen-coordinator.github.io/', 'Expected GitHub link to point to the correct URL');
});
