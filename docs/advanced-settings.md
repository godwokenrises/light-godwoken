Background:

- A feature: The User can cancel a deposit if the deposit is not packed by roll-up after a range of time, which is determined by the deposit lock contract. For godwoken v0, it's 20 minutes, and for v1, it's 7 days.

Why:

- We have already supported the "cancel deposit" functionality, but it's a problem for testers to test this feature since it takes too long to wait for the deposit to expire. If a user can configure expiration time, it's great to test cancel deposit.

How: 

1. go to Godwoken Bridge: https://light-godwoken-git-advanced-settings-cryptape.vercel.app/#/v1
2. open developer tools in browser and navigate to `Application`, find `local storage` in left panel: 
<img width="1914" alt="image" src="https://user-images.githubusercontent.com/3870972/172973026-0b0a4900-5b73-4483-8b95-b516a25b4f6c.png">
3. change `MIN_CANCEL_DEPOSIT_TIME` to an acceptable time(I change it to `1`) to wait for the deposit to expire. The time unit is seconds. Then you can **refresh** the page and fire a deposit. After a short time, the deposit should be cancelable.
<img width="456" alt="image" src="https://user-images.githubusercontent.com/3870972/172973643-de549245-0f89-4ce9-a03c-035c88a53b88.png">


FAQ:

- Why other deposit histories are gone after I changed this setting?
  - Modifying `cancel_timeout` will change the deposit lock for the current account, so that the assets deposited to the original deposit lock can't be indexed here. Reset(or remove) the advanced settings to go back to normal mode. 
