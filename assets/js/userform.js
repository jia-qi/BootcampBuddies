$(document).ready(function() {
    var config = {
        apiKey: "AIzaSyC1_tDsGAAxrdVQdt4JqsUg8znxe_bPC_k",
        authDomain: "bootcampbuddies-userform.firebaseapp.com",
        databaseURL: "https://bootcampbuddies-userform.firebaseio.com",
        storageBucket: "bootcampbuddies-userform.appspot.com",
        messagingSenderId: "1072508458086"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    var id;

    var originalAttributes = $("#createUser").attr("class");




    $("#password2").on("keyup", function() {
        var password = $("#password").val().trim();
        var password2 = $("#password2").val().trim();
        if ($("#password").val().trim() == $("#password2").val().trim()) {
            $("#confirmMessage").attr("style", "color: green;");
            $("#confirmMessage").html("passwords match!");
            $("#createUser").attr("class", originalAttributes);
        } else {
            $("#confirmMessage").attr("style", "color: red;");
            $("#confirmMessage").html("passwords DO NOT match!");
            $("#createUser").attr("class", "btn disabled");
        }
    });

    $("#name").change(function() {
        name = $("#name").val().trim();
    });

    $("#age").change(function() {
        age = $("#age").val();
    });

    $("#createUser").on("click", function() {
        var email = $("#email").val().trim();
        var password = $("#password").val().trim();
        var name = $("#name").val().trim();
        var age = $("#age").val();
        var address = $("#address").val().trim();
        var experience = $("#experience").val();
        var checkedLanguages = [];
        var interests = [];
        $("input:checkbox[name=languages]:checked").each(function(){
          checkedLanguages.push($(this).val());
        })
        $("input:checkbox[name=languages]:checked").each(function(){
          interests.push($(this).val());
        })

        var newUser = {
            name: name,
            email: email,
            age: age,
            address: address,
            languages: checkedLanguages,
            interests: interests,
            experience: experience


        }
      firebase.auth().createUserWithEmailAndPassword(email, password).then(function(firebaseUser) {
          if (firebaseUser) {
              console.log(firebaseUser.uid);
          }

          var id = firebaseUser.uid;

          const dbUser = database.ref().child("users/" + id);
          // database.ref(id).set(newUser);
          dbUser.set(newUser);
      });

    });
});