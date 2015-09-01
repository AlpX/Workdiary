# Workdiary

An example application I made for work logging using nodejs mongodb, angularjs, nodemailer and socket.io.

Client side is just a one page slider view. First is login page:
![](http://alpx.io/wp-content/uploads/2015/09/workdiarylogin.png)

When you click login, the client side js sends the credentials to the server side using socket.io. Server code checks the mongodb database for credentials. If they are true it sends back the response with socket.io again. I also implemented a session logic here. If user have sent a valid credential once, it connection socket is marked as ‘logged in’. So the further requests are accepted from this socket connection until it logs out or the page is closed (meaning socket connection is closed). If the internet connection is gone for more then around 10 seconds also the socket connection from the offline webpage is logged out by server. This is done by ‘on disconnect’ function of socket.io.
When user logged in the one page changes into a date selection page.

![](http://alpx.io/wp-content/uploads/2015/09/workdiarydate.png)

Simply you choose the date for logging your work that day. The UI allows yesterday and later day to be selected. After selecting the date click ‘Work Log’. The page changes into the work logging page.

![](http://alpx.io/wp-content/uploads/2015/09/workdiarylog.png)

The inputs are in order: ‘What did I do today?’, ‘What will I do tomorrow?’, ‘What are the obstacles I faced today if any?’.
If there are previously entered logs, they are read from mongodb and sent to client page by socket.io. The text boxes will be filled. If you make any change or write new entry to the text boxes, when you click ‘Save’, they will be saved to the mongodb database.

In addition to making work logs, the Workdiary application sends reminders to those who didn't enter their work log on 22:30. At 23:00 a work diary report email is sent to an email group which includes all users. The report includes a html content of users' work logs in a table. I used nodemailer for emailing from an exchange email account from work.
