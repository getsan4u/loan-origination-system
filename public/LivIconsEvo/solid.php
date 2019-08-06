<!DOCTYPE html>
<html lang="en">
<head>
    <title>LivIcons Evolution - Solid Style</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1">
    <meta charset="utf-8">
    <link href='https://fonts.googleapis.com/css?family=Roboto:100,400,700,500,300,300italic' rel='stylesheet' type='text/css'>
    <link href='css/LivIconsEvo.css' rel='stylesheet' type='text/css'>
    <style type="text/css">
        body {
            font-family: Roboto, sans-serif;
        }
        .container {
            width:800px;
            margin: 0 auto;
        }
        h1 {
            font-size: 36px;
            font-weight: 300;
            color: #34343c;
            text-align: center;
            margin: 40px 0 60px;
        }
        h1 small{
            font-size: 18px;
            font-weight: 300;
            color: #A1A1B1;
        }
        .livicon-wrapper {
            width:160px;
            height:160px;
            float:left;
        }
        .livicon-evo-holder {
            margin: 0 auto;
        }
        .desc {
            text-align: center;
            font-size: 12px;
            font-weight: 300;
            color: #A1A1B1;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>LivIcons Evolution - Solid Style<br>
            <small>all the icons are in alphabetical order</small>
        </h1>
        <?php
            $path = "svg/";
            $files = array_diff(scandir($path), array('..', '.'));
            foreach($files as $file) {
                $ext = pathinfo($file, PATHINFO_EXTENSION);
                if ($ext == 'svg') {
                    echo '<div class="livicon-wrapper"><div class="livicon-evo" data-options="name:'. $file .'; size:60px; style:solid; morphState:start"></div><p class="desc">'. substr($file, 0, -4) .'</p></div>';
                }
            }
        ?>
        <div style="clear:left;"></div>
    </div>
    <script src="js/jquery-1.12.3.min.js"></script>
    <script src="js/LivIconsEvo.Tools.js"></script>
    <script src="js/LivIconsEvo.defaults.js"></script>
    <script src="js/LivIconsEvo.min.js"></script>
</body>
</html>