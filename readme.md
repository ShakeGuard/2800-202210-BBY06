# Project: ShakeGuard

## Description

Our team, BBY6, developed ShakeGuard to help British Columbians prepare for earthquakes, with or without access to a stable internet connection.


## Technologies Used

### Front End

- HTML
- CSS
- JS

### Back End

- Service Worker 
- MongoDB
- Express
- BCrypt


## Contents

│  .gitignore                                                                                                           
│  downloadSecrets.mjs                                                                                                  
│  logging.mjs                                                                                                          
│  main.js                                                                                                              
│  package-lock.json                                                                                                    
│  package.json                                                                                                         
│  readme.txt                                                                                                           
│  shakeguardSecrets.mjs                                                                                                
│                                                                                                                       
├─.github                                                                                                               
│  └─workflows                                                                                                          
│          validate-css.yml                                                                                             
│          validate-html.yml                                                                                            
│                                                                                                                       
├─.secrets                                                                                                              
│      mongodb_auth.json                                                                                                
│      session.json                                                                                                     
│                                                                                                                       
├─.vscode                                                                                                               
│      launch.json                                                                                                      
│      removeSecrets.cmd                                                                                                
│      removeSecrets.sh                                                                                                 
│      tasks.json                                                                                                       
│                                                                                                                       
├─data                                                                                                                  
│      articles.json                                                                                                    
│      categories.json                                                                                                  
│      items.json                                                                                                       
│      kits.json                                                                                                        
│      users.json                                                                                                       
│                                                                                                                       
├─deploy                                                                                                                
│      DEPLOYING.md                                                                                                     
│      shakeguard.service                                                                                               
│                                                                                                                       
├─html                                                                                                                  
│      dashboard.html                                                                                                   
│      index.html                                                                                                       
│      login.html                                                                                                       
│      resource.html                                                                                                    
│      resource_page1.html                                                                                              
│      resource_page2.html                                                                                              
│      resource_page3.html                                                                                              
│      resource_page4.html                                                                                              
│      resource_page5.html                                                                                              
│      resource_page6.html                                                                                              
│      user-profile.html                                                                                                
│                                                                                                                       
├─logs                                                                                                                  
│      access.log                                                                                                       
│      app.log                                                                                                          
│      error.log                                                                                                        
│                                                                                                                       
├─public                                                                                                                
│  ├─css                                                                                                                
│  │      admin-dashboard.css                                                                                           
│  │      all_resource_pages.css                                                                                        
│  │      buttons.css                                                                                                   
│  │      card.css                                                                                                      
│  │      forms.css                                                                                                     
│  │      header-footer.css                                                                                             
│  │      index.css                                                                                                     
│  │      login.css                                                                                                     
│  │      resource.css                                                                                                  
│  │      style.css                                                                                                     
│  │      user-profile.css                                                                                              
│  │                                                                                                                    
│  ├─images                                                                                                             
│  │      ali-kazal-jwyFn9kxQuc-unsplash-greyscale.jpg                                                              
│  │      ali-kazal-jwyFn9kxQuc-unsplash-smaller.jpg                                                                
│  │      ali-kazal-jwyFn9kxQuc-unsplash.jpg                                                                            
│  │  comp2800_logo.svg                                                                                             
│  │      comp2800_logo_favicon.ico                                                                                     
│  │      comp2800_logo_white.svg                                                                                       
│  │      Default-Profile-Picture.jpg                                                                                   
│  │      Default-Profile-Picture.txt                                                                               
│  │      menu-icon-black.svg                                                                                           
│  │      mountain1.jpg                                                                                                 
│  │      mountain2.png                                                                                                 
│  │      mountain3.png                                                                                                 
│  │      mountain4.jpg                                                                                                 
│  │      Resource1.jpg                                                                                                 
│  │      Resource2.jpg                                                                                                 
│  │      Resource3.jpg                                                                                                 
│  │      Resource4.jpg                                                                                                 
│  │      Resource5.jpg                                                                                                 
│  │      Resource6.jpg                                                                                                 
│  │      user-pic_Tracy.svg                                                                                            
│  │                                                                                                                    
│  └─js                                                                                                                 
│          client.js                                                                                                    
│          dashboard.js                                                                                                 
│          logout.js                                                                                                    
│          profile.js                                                                                                   
│          toasts.mjs                                                                                                   
│          user-profile.js                                                                                              
│                                                                                                                       
└─templates
card.html                                                                                                               
footer.html                                                                                                             
header.html                                                                                                             
kit.html                                                                                                                
profile.html


## How to install or run the project

### To install and run the project locally:

1. Clone the repo
2. Install MongoDB
    - You can download the [Community Edition](https://www.mongodb.com/docs/manual/administration/install-community/)
    - Download [Mongo Compass](https://www.mongodb.com/try/download/compass) to view and manage the database
3. In command or terminal, navigate to the cloned repo and install **node.js** and required modules
4. To run the project, make sure you’re on the **main** branch, then type `npm start`
5. Open a browser and type `localhost:8000` in URL bar to see the project in action. Ideally, use Firefox or Chrome

**Note:** While we aim to resolve as many bugs as we can, there may be some that we’ve missed. Our testing plan can be seen [here](https://docs.google.com/spreadsheets/d/1DN5sXhGesBAcnumLzI-bTYiwUIrDc1Aa7SAjsazKxc4/edit?usp=sharing).

## How to use the product (Features)

1. From the landing page, click “Start your Kit”.
2. Log in with account credentials
    - **Note:** At this point in time, there is no signup page. Once the GitHub project is cloned and mongoDB is set up locally, four default user accounts will be created (two admins and two regular users). Use account credentials (provided separately) for these users to login.
3. **(Customizable Profile)** After logging in, you should be redirected to the profile page. It has your profile picture and “Edit Profile” button.
    - If you would like to modify account details, click on “Edit Profile” and you should see the window expand and buttons appear on the bottom right of each respective field.
    - Click on the Pen Icons to enable editing.
4. **(Digital Earthquake Kit)** Once logged in, you should immediately see the profile page.
    - Scroll down and find “Your Kits” and click on “Create Kit”.
    - Select either the “Grab-and-Go Bag” or “Home Kit” and click “Submit” to create it.
5. **(Admin DashBoard)** Once logged in with an Admin Account, you should land immediately on the profile page.
    - Scroll down to find “Admins”.
    - Click on the Pen icon to edit or click on the Trash icon to delete the respective accounts.
6. **(Resource Page)** There is a hamburger icon on the top right, click it and it will expand a drop down menu containing “Your Kit”, “Resource” and “Log out”.
    - Click “Resource”. At this point you should see the title “Resource” with an assortment of cards under the title.
    - Click into any one of the cards to read more about their respective subjects.


## Credits, References, and Licenses

### Images

Photos used in ShakeGuard are sourced from Unsplash and Pexels.

#### Unsplash

- Ali Kazal, <https://unsplash.com/photos/jwyFn9kxQuc> 
- Calle Macarone, <https://unsplash.com/photos/Vl78eNdiJaQ> 
- Caludio Schwarz, <https://unsplash.com/photos/ZzMqZMl7s-A> 
- Felix M. Dorn, <https://unsplash.com/photos/hcti0k5E2Iw> 
- Glenn Carstens-Peters, <https://unsplash.com/photos/RLw-UC03Gwc> 
- Jayson Hinrichsen, <https://unsplash.com/photos/qLs4WYXqLNY>
- Marina Grynykha, <https://unsplash.com/photos/y4HelY0jx7c>
- Markus Winkler, <https://unsplash.com/photos/UP_RojtnvTU>
- Nathan Dumlao, <https://unsplash.com/photos/CHaIF4oJRtI>
- PiggyBank, <https://unsplash.com/photos/lq-PS3Yyzg8>
- Towfiqu barbhuiya, <https://unsplash.com/photos/WLPwW1gGyKg>

#### Pexels

- Anete Lusina, <https://www.pexels.com/photo/set-of-various-instruments-for-work-for-architect-4792501> 
- Anna Shvets, <https://www.pexels.com/photo/person-holding-white-and-green-plastic-bag-3962260>
-CDC, <https://www.pexels.com/photo/n95-face-mask-3993241>
- cottonbro, <https://www.pexels.com/photo/person-holding-can-on-black-and-gray-marble-table-6003041>
- Roger Brown, <https://www.pexels.com/photo/first-aid-and-surival-kits-5125690>
- Tara Winstead
    - <https://www.pexels.com/photo/close-up-photo-of-toothbrushes-6690826>
    - <https://www.pexels.com/photo/plate-art-blue-eating-7123073>
    - <https://www.pexels.com/photo/a-set-of-cleaning-tools-and-disinfectants-on-blue-surface-7722677>
- Tima Miroshnichenko, <https://www.pexels.com/photo/close-up-photo-of-a-silver-whistle-6204479> 
- Vie Studio, <https://www.pexels.com/photo/toilet-paper-rolls-on-green-towel-3963085>

### BenSound

"All That" By Benjamin Tissot (also known as Bensound) Music: <https://www.bensound.com>

### Fonts

We used fonts from Fontshare, Google Fonts, and Tom Murphy.

- [Fontshare](www.fontshare.com) - Fonts provided by Fontshare are free for personal and commercial use, but not open-source. We have used the following fonts via Fontshare’s API. The End-User License Agreement can be found [here](https://www.fontshare.com/terms).
    - Satoshi - ​​Designed by Deni Anggara
    - Sharpie - Designed by Théo Guillard

- [Google Fonts](fonts.google.com/icons) - We’ve used Google’s Material Icons via their API. Open source.
    - Material Icons

- [Tom Murphy VII](fonts.tom7.com) - Fonts provided by Tom are free for personal and commercial use. We have downloaded the following font which will be self-hosted. The license can be found [here](http://fonts.tom7.com/legal.html). 
    - Levity


## Contact Information

- Jay Wang, <jwang550@my.bcit.ca>
- Tracy Ly, <tly35@my.bcit.ca>
- Alex Kong, <akong22@my.bcit.ca>
- Katy Petrova, <spetrov@my.bcit.ca>


