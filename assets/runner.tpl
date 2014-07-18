<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%= name %></title>
    <script src="/mocha/mocha.js"></script>
    <script src="./neurons/neuron.js"></script>
    <script>
        var global = window;
        neuron.config({
            path:"neurons",
            graph: <%= JSON.stringify(graph) %>,
            loaded:["<%= name %>@<%= version %>"]
        });
    </script>
    <link rel="stylesheet" href="/mocha/mocha.css">
</head>
<body>
    <div id="mocha"></div>
    <%= html %>
    <script>

    mocha.NO_CATCH_EXCEPTIONS = true;
    !window.PHANTOMJS && mocha.setup("bdd");
    <%= scripts %>
    _use("<%= name %>@<%= version %>",function(){
        mocha.run();
    });


    </script>
</body>
</html>