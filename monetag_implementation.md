- make a detailed implementation plan to implement monetag ads into the app.
I want all thses formats.
Rewarded Interstitial
Native banner with reward for viewing. Click on it leads to offer page.

Rewarded Popup
After click on your element user goes directly to offer page, without banner, and gets a reward.


In-app Interstitial
Native banner shown according to your timeframe settings. No reward required.


- Guide for you

Ad Integration #
Monetag SDK Overview #
Monetag provides a single, unified SDK that supports all available ad formats for Telegram Mini Apps: Rewarded Interstitial, Rewarded Popup, and In-App Interstitial. This makes integration easy and efficient, regardless of which format you choose.

Key Benefits #
One SDK file for all ad formats
Easy integration with minimal setup
Fully compatible with Telegram WebView (Android and iOS)
Supports both automatic and manual ad triggering
Designed to maintain a smooth user experience
How the SDK Works #
The Monetag SDK handles everything needed to display ads and track performance. Once integrated into your Mini App, it can:

Show ads automatically or on user actions
Load full-screen or popup ads depending on context
Trigger optional reward logic for the user
Automatically close or dismiss ads after completion
You can decide when and how to show ads in your app — for example, after a user completes a task, reaches a new level, or spends a certain amount of time inside the app.

Integration Overview #
To integrate Monetag SDK into your Telegram Mini App, you only need to:

Add the provided SDK script to your HTML
Choose whether to trigger ads manually or use automatic display logic
Call simple functions in your app where you want the ads to appear
The SDK is lightweight and does not require backend integration or complex configuration.

Developer-Friendly Setup #
No need to manage multiple scripts or ad tags
Works with all modern front-end frameworks (including vanilla JS, React, and Vue)
Supports common use cases like reward delivery, session timers, and screen transitions
Detailed integration examples and code samples are available in the following sections for each ad format.
SDK Integration #
To start showing ads in your Telegram Mini App, the first step is to integrate the Monetag SDK. This SDK is a universal client-side JavaScript file that supports all available formats: Rewarded Interstitial, Rewarded Popup, and In-App Interstitial.

You can integrate it either by including a script tag in your HTML, or by installing an npm package for modern JavaScript frameworks like React.

Method 1: Script Tag #
For basic HTML-based apps, include the following script in your HTML file:

<script src="https://domain.com/sdk.js" data-zone="XXX" data-sdk="show_XXX"></script>
Replace XXX with your ad zone ID from the Monetag dashboard.

After this script is loaded, the global method show_XXX() will be available in your app. This method is used to show ads and control ad logic from your JavaScript code.

Method 2: npm Package (for React or modern front-end stacks) #
Install the official Monetag SDK via npm:

npm install monetag-tg-sdk --save
Then use it in your app like this:

import createAdHandler from 'monetag-tg-sdk'

const showAd = createAdHandler(YOUR_ZONE_ID)
This gives you a function that works exactly like show_XXX() from the script-based version.

Behavior of the SDK #
The SDK ignores zone-level settings like frequency, interval, and timeout. You manage those manually in your app.
The SDK returns a Promise from each show() call, resolving when the ad completes or rejecting if there’s an error or timeout.
The SDK can preload ads, letting you show them instantly later.
You can track ad placements with the requestVar option.
You can pass user IDs (e.g. ymid) to support postback tracking on the backend.
You can handle fallback logic if an ad is not available.
Best Practices #
Preload ads when possible to avoid delays when showing.
Always use .catch() on SDK calls to gracefully handle cases where an ad fails to load or is unavailable.
If you’re using user IDs or rewards, pass ymid consistently in both preload and show calls.
Use requestVar to track performance of specific placements in your app.
Avoid placing SDK scripts multiple times in the app – use one per zone.
In React apps, use state to track when ads are ready before enabling buttons.
In production, test all ad behaviors inside Telegram, not just in a browser.
Avoid These Common Mistakes #
These are based on issues we’ve seen from real publishers:

Calling show_XXX() without preloading, leading to visible delays
Forgetting to use .catch() and showing no feedback to users on ad failure
Using outdated scripts or incorrect zone IDs
Expecting SDK to follow zone settings (frequency, timeout, etc.) — SDK overrides them
Forgetting to set ymid for rewarded postbacks
React components not disabling ad buttons while preloading
Once the SDK is integrated, you can proceed to implement specific ad formats. Each format has different logic and placement strategies, which we’ll cover in the next sections.
Rewarded Interstitial – Integration Guide #
Rewarded Interstitial is a full-screen ad format that grants a reward to the user after they watch the ad. The Monetag SDK provides a simple method to display and control this format, with support for preloading, user tracking, and fallback handling.

Example

This guide explains how to implement the format in your Telegram Mini App using both standard JavaScript and React (via the official npm package).

⚠️ Important: For proper positioning of UI elements (e.g. the close button and timer), it’s recommended to use the official Telegram WebApp SDK (Telegram.WebApp).
If the SDK is not available, Monetag cannot detect safe visual areas, and interface elements might overlap with Telegram or system UI (as seen on some devices).
To ensure visual stability, you should connect the Telegram SDK manually.

Basic Usage (Script Tag) #
If you’re using the SDK via HTML, trigger the ad with:

show_XXX().then(() => {
  console.log('User watched the ad');
}).catch(() => {
  console.log('Ad failed or was skipped');
});
Replace XXX with your main zone ID — the one provided in your Monetag dashboard for the SDK setup.
The main zone controls the entire SDK behavior and links to all related sub-zones.

Basic Usage (React + npm package) #
import createAdHandler from 'monetag-tg-sdk'

const adHandler = createAdHandler(REWARDED_INTERSTITIAL_ZONE_ID)

const ShowAdButton = () => {
  const onClick = () => {
    adHandler().then(() => {
      console.log('User watched the ad')
    }).catch(() => {
      console.log('Ad failed or was skipped')
    })
  }

  return <button onClick={onClick}>Show Ad</button>
}
Tracking Events with ymid #
You can pass a unique identifier using the ymid parameter:

show_XXX({ ymid: 'user-id-or-event-id' })
This identifier will be included in the postback and can be used on your backend to match the ad impression to a specific user or event.

You can use:

A user ID from your system
A session ID
A UUID
Any unique string that helps you identify the action
Telegram.WebApp.ready()
// Then the SDK may resolve the Telegram user ID automatically
Preloading the Ad #
To reduce delay at the moment of ad display, you can preload it:

show_XXX({ type: 'preload', ymid: 'event-id-123' }).then(() => {
  show_XXX({ ymid: 'event-id-123' })
})
React example:

const [adReady, setAdReady] = useState(false)

useEffect(() => {
  show_XXX({ type: 'preload', ymid: 'event-id-123' }).then(() => setAdReady(true))
}, [])

const onClick = () => {
  show_XXX({ ymid: 'event-id-123' })
}
Fallback Logic #
If the ad is unavailable or fails to show, you can fall back to another ad source:

show_XXX({ type: 'preload', ymid: 'event-id' }).then(() => {
  show_XXX({ ymid: 'event-id' }).catch(() => {
    showOtherAd()
  })
}).catch(() => {
  showOtherAd()
})
Common Mistakes to Avoid #
Calling show_XXX() without .catch() – no way to handle failures or show fallback
Not passing ymid – postback will still be triggered, but it won’t be linked to a known user or event unless Telegram ID is resolved
Using sub-zone ID instead of the main zone ID – the SDK may not work properly
Not preloading – ads may appear with a noticeable delay
Triggering ads before the SDK has loaded
Including multiple SDK tags on the same page
Best Practices #
Preload ads before enabling “Watch Ad” buttons
Provide user feedback (e.g. loading states) during preloading
Handle reward logic only after the .then() callback resolves
Use ymid to link postbacks to internal user or event logic
Use requestVar if you want to track different placements or buttons
Always test your integration inside Telegram, not just in a browser
Once Rewarded Interstitial is working, you can confidently implement reward logic and start monetizing your app effectively.
Rewarded Popup – Integration Guide #
Rewarded Popup is an ad format that opens an advertiser’s page when the user interacts with a specific element in your app (such as a button). This format is best suited for scenarios where users are incentivized to visit an offer page.

Example

Unlike interstitials, Rewarded Popup does not display a full-screen ad inside your app — instead, it redirects the user externally, while allowing you to control when and how that happens.

Key Characteristics #
Can only be triggered by a direct user action (e.g. button click)
Opens the advertiser’s page in a browser environment
Works well for incentivized navigation (e.g. “Visit and earn”)
Can be tracked with ymid and requestVar parameters
Important:
The ad may open in one of the following environments:

Telegram’s built-in browser (default behavior)
A separate tab inside the Telegram browser
The device’s external system browser
This behavior depends on the Telegram client version and the user’s browser preferences. Telegram allows users to configure how external links are opened — they can choose to always use the internal browser, set a specific browser app, or delegate to the default system browser.

How Reward Handling Works #
Currently, the Promise returned by the SDK resolves immediately after the app attempts to open the advertiser’s link. At this point, we cannot determine whether the user actually visited the page or interacted with it.

We are actively working on an improved solution that will resolve the Promise only after our backend infrastructure confirms the user’s visit to the landing page.

Until then, you should treat .then() as confirmation that the popup was triggered — not necessarily that it was viewed.

Basic Usage (Script Tag) #
button.addEventListener('click', () => {
  show_XXX({ type: 'pop' }).then(() => {
    console.log('Popup attempt completed')
  }).catch(() => {
    console.log('Popup ad failed to open')
  })
})
Replace XXX with your main zone ID.

Basic Usage (React + npm package) #
import createAdHandler from 'monetag-tg-sdk'

const adHandler = createAdHandler(REWARDED_INTERSTITIAL_ZONE_ID)

const ShowAdButton = () => {
  const onClick = () => {
    adHandler({ type: 'pop' }).then(() => {
      console.log('Popup attempt completed')
    }).catch(() => {
      console.log('Popup ad failed to open')
    })
  }

  return <button onClick={onClick}>Show Ad</button>
}
Using ymid for Tracking #
You can pass an identifier to match the postback with a specific user or event:

show_XXX({ type: 'pop', ymid: 'event-123' })
React version:

adHandler({ type: 'pop', ymid: 'event-123' }).then(() => {
  // reward logic
})
Possible values for ymid include:

User ID
Session ID
Placement ID
Any custom string meaningful to your backend
If ymid is not provided, the SDK will attempt to retrieve the Telegram user ID automatically (if the Telegram Web App API is initialized in your app).

Best Practices #
Always trigger show_XXX({ type: 'pop' }) directly from a user-initiated event (e.g. click)
Clearly inform the user what reward they get for tapping the button
Use requestVar to track performance of different buttons or placements
Use .catch() to handle popup blockers or user interruptions
Design fallback logic if an external page fails to open
Common Mistakes to Avoid #
Trying to trigger the popup without a user interaction — browsers will block it
Not using .catch() — results in missed handling if the tab fails to open
Using a sub-zone ID — must always use the main SDK zone
Assuming the Promise means the user visited the page — it only confirms an attempt
Forgetting to pass ymid — backend postbacks will be harder to trace
Rewarded Popup is quick to integrate, and when used in the right flow, can become a valuable source of monetization while offering users optional engagement.


In-App Interstitial – Integration Guide #
In-App Interstitial is a passive ad format that automatically displays full-screen ads at set intervals while the user interacts with your Mini App. It’s designed for background monetization without requiring direct user interaction or rewards.

Example

This format is best suited for apps with long session durations or frequent navigation between screens or sections.

⚠️ Important: For proper positioning of UI elements (e.g. the close button and timer), it’s recommended to use the official Telegram WebApp SDK (Telegram.WebApp).
If the SDK is not available, Monetag cannot detect safe visual areas, and interface elements might overlap with Telegram or system UI (as seen on some devices).
To ensure visual stability, you should connect the Telegram SDK manually.

Key Characteristics #
Ads appear automatically, based on your configured frequency
Does not require explicit user actions
Does not return a Promise or trigger postbacks
Works silently in the background while the app is in use
You can trigger this format either via SDK configuration in JavaScript or through parameters in the SDK script tag.

Manual Setup via SDK #
The SDK provides a method to enable auto-display logic programmatically:

show_XXX({
  type: 'inApp',
  inAppSettings: {
    frequency: 2,
    capping: 0.1,
    interval: 30,
    timeout: 5,
    everyPage: false
  }
})
Explanation of parameters:

frequency: maximum number of ads per session
capping: duration of session in hours (e.g. 0.1 = 6 minutes)
interval: time in seconds between ads
timeout: delay before the first ad appears (in seconds)
everyPage: if true, resets the session on each page reload
You can also use this approach in React via the npm SDK:

import createAdHandler from 'monetag-tg-sdk'

const adHandler = createAdHandler(MAIN_ZONE_ID)

adHandler({
  type: 'inApp',
  inAppSettings: {
    frequency: 3,
    capping: 0.5,
    interval: 30,
    timeout: 10,
    everyPage: false
  }
})
Configuration via Script Tag #
You can enable in-app interstitials using the data-auto attribute directly in the script tag:

<script
  src="https://domain.com/sdk.js"
  data-zone="XXX"
  data-sdk="show_XXX"
  data-auto="2/0.1/30/5/0">
</script>
This example displays up to 2 ads over 6 minutes (0.1 hours), with 30 seconds between them and a 5-second delay before the first ad. The final 0 means the session continues across pages.

Custom Timers with Fallback Logic #
If you prefer full control, you can build your own timer-based logic using the SDK and handle fallback scenarios manually:

setInterval(() => {
  show_XXX({ type: 'preload' }).then(() => {
    show_XXX()
  }).catch(() => {
    showOtherAd()
  })
}, 1000 * 60 * 5) // every 5 minutes
This allows you to display alternate ads or messages if Monetag inventory is unavailable.

Best Practices #
Use moderate frequency settings to avoid annoying users
Place logic in a persistent part of the app (not tied to one screen)
Avoid triggering too soon after the app opens — use a delay
Track user engagement to avoid showing ads during critical interactions
Test in both light and dark modes of Telegram WebView
Common Mistakes to Avoid #
Calling show_XXX({ type: 'inApp' }) multiple times in a row — this may reset the internal logic and interrupt the ad flow
Forgetting to preload if using manual timers
Using aggressive frequency (e.g. more than 1 ad per minute)
Misplacing the SDK script or using the wrong zone ID (must be the main zone)
In-App Interstitial is an excellent way to monetize passive engagement while maintaining a clean user experience. When configured correctly, it can run silently and effectively in the background of your app.

Ad Integration #
Debugging & Error Handling #
Proper error handling is critical for ensuring a smooth user experience and maintaining the stability of your monetization setup. This section covers common sources of problems and how to detect, debug, and resolve them when using the Monetag SDK.

How to Catch Errors from the SDK #
The SDK methods (like show_XXX()) return Promises. If something goes wrong — such as an ad failing to load, being blocked, or timing out — the Promise will reject.

Always use .catch() to avoid unhandled rejections and control the fallback logic.

show_XXX().then(() => {
  // success logic
}).catch(() => {
  // handle failure: show message or fallback ad
})
React example:

adHandler().then(() => {
  // success
}).catch(() => {
  // error fallback
})
Common Causes of Failure #
Ad inventory not available

Monetag may not have a suitable ad to show at the moment of the request.

Solution: Use .catch() and fallback to another action or ad source.

Called outside of user interaction (for Rewarded Popup)

Browsers block new tabs unless triggered by a real user action like a button click.

Solution: Always call show_XXX({ type: 'pop' }) inside an onClick handler or similar user gesture.

Incorrect or missing zone ID

If the script uses the wrong data-zone or you initialize createAdHandler() with a sub-zone instead of the main zone, the SDK won’t work correctly.

Solution: Double-check the zone ID in your Monetag dashboard. Use only the main zone ID provided for the SDK.

SDK not fully loaded

Attempting to call SDK methods before the script has been fully loaded and parsed will result in a ReferenceError.

Solution: Always call ad functions after the SDK script is loaded, or inside a useEffect() / DOMContentLoaded / similar lifecycle hook.

Telegram WebView limitations

Sometimes ads are blocked or behave unexpectedly inside Telegram WebView on certain devices.

Solution: Test on both Android and iOS Telegram apps, and ensure that Telegram’s Web App API is initialized.

Popup blocked by browser

If the browser prevents opening a new tab (common on mobile Safari), the Rewarded Popup will fail.

Solution: Make sure the popup is tied directly to a user interaction, and always use .catch() to handle rejection.

Debugging Checklist #
✅ Are you using the correct (main) zone ID?
✅ Is the SDK script properly loaded before calling any functions?
✅ Is .catch() implemented for every ad function?
✅ Is the ad triggered from inside a user action if it’s a popup?
✅ Is ymid passed consistently for postback tracking?
✅ Have you tested in the actual Telegram environment, not just a desktop browser?
Tools for Debugging #
Use console.log() statements inside .then() and .catch() to trace behavior.
Monitor browser DevTools Console for warnings, failed requests, or JS errors.
Inspect network activity to verify that SDK scripts load correctly.
Watch for blocked popups or CORS issues in the browser console.
Example: Graceful Fallback on Failure #
show_XXX({ type: 'preload', ymid: 'event-123' }).then(() => {
  show_XXX({ ymid: 'event-123' }).catch(() => {
    showOtherAd()
  })
}).catch(() => {
  showOtherAd()
})
Debugging and handling errors properly will make your ad integration much more stable, improve user experience, and reduce support questions from your team or partners.
Frontend Callback #
The Monetag SDK provides a built-in frontend callback mechanism based on backend-confirmed events.
It allows your app to respond to confirmed ad interactions directly in the user interface — such as unlocking content, displaying messages, or triggering rewards.

This callback is implemented via a Promise returned by the SDK function show_XXX().

How It Works #
When an ad is triggered using the SDK:

show_XXX().then((result) => {
  // Frontend Callback: ad event confirmed by backend
}).catch(() => {
  // Ad failed, rejected, or timed out
})
The Promise resolves only when the SDK receives confirmation from the backend that the ad event (such as an impression) was registered and processed.

Under the hood: #
After showing the ad, the SDK sends a request to the backend.
Then it polls for the event confirmation up to 3 times using increasing intervals:
1.5 seconds
3 seconds
4.5 seconds
If a successful response is received during this polling — the .then() callback resolves.
If no valid response is received after all attempts — the .catch() callback fires.
This makes frontend callbacks reliable, but not instant.

What You Get in the Callback #
When the Promise resolves, it includes the same enriched event data as server-side postbacks:

Field	Description
event_type	impression or click
ymid	Your original event/session identifier
reward_event_type	valued or not_valued
estimated_price	Approximate payout (USD)
zone_id	Main zone ID
sub_zone_id	Actual zone ID where the event occurred
request_var	Placement ID (e.g. button, screen name)
telegram_id	Telegram User ID (if passed by Telegram SDK)
📖 See the Macro Reference section for a full description for each field.

Example usage:

show_XXX().then((event) => {
  if (event.reward_event_type === "valued") {
    giveReward()
  } else {
    showInfo("Ad was shown but not monetized.")
  }
}).catch(() => {
  showError("Ad did not complete.")
})
Limitations #
Relies on client-server communication: may fail if the user’s connection is unstable.
Only works for Rewarded Interstitial and Rewarded Popup.
Does not work for In-App Interstitial.
If the user closes the app too early, the .then() may never resolve.
Best Practices #
✅ Use frontend callbacks for user experience and optimistic UI flows
✅ Combine with postbacks for accounting and reward logic
✅ Always handle .catch() to detect timeouts or failed loads
❌ Don’t rely solely on .then() to issue real-world rewards
Summary #
Use Case	Frontend Callback	Server-Side Postback
Show UI message	✅	Optional
Grant in-app currency	⚠️ Still use postback	✅
Trigger animation	✅	❌
Confirm event value	⚠️ Partial	✅
Track monetization	❌	✅
Frontend callbacks now reflect real backend-confirmed events, offering both flexibility and transparency — while server-side postbacks remain the foundation for critical reward and revenue logic.




