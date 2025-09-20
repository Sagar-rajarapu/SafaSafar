@echo off
echo Fixing namespace issues for Gradle 8.0 compatibility...
echo.

echo Adding namespaces to all React Native libraries...

echo Fixing react-native-geolocation-service...
echo namespace 'com.agontuk.RNFusedLocation' >> temp_namespace.txt
findstr /v "namespace" node_modules\react-native-geolocation-service\android\build.gradle > temp_file.txt
echo android { >> temp_file2.txt
echo     namespace 'com.agontuk.RNFusedLocation' >> temp_file2.txt
findstr /v "android {" temp_file.txt >> temp_file2.txt
move temp_file2.txt node_modules\react-native-geolocation-service\android\build.gradle
del temp_file.txt temp_namespace.txt

echo Fixing react-native-linear-gradient...
echo namespace 'com.BV.LinearGradient' >> temp_namespace.txt
findstr /v "namespace" node_modules\react-native-linear-gradient\android\build.gradle > temp_file.txt
echo android { >> temp_file2.txt
echo     namespace 'com.BV.LinearGradient' >> temp_file2.txt
findstr /v "android {" temp_file.txt >> temp_file2.txt
move temp_file2.txt node_modules\react-native-linear-gradient\android\build.gradle
del temp_file.txt temp_namespace.txt

echo Fixing react-native-maps...
echo namespace 'com.airbnb.android.react.maps' >> temp_namespace.txt
findstr /v "namespace" node_modules\react-native-maps\android\build.gradle > temp_file.txt
echo android { >> temp_file2.txt
echo     namespace 'com.airbnb.android.react.maps' >> temp_file2.txt
findstr /v "android {" temp_file.txt >> temp_file2.txt
move temp_file2.txt node_modules\react-native-maps\android\build.gradle
del temp_file.txt temp_namespace.txt

echo Fixing react-native-vector-icons...
echo namespace 'com.oblador.vectoricons' >> temp_namespace.txt
findstr /v "namespace" node_modules\react-native-vector-icons\android\build.gradle > temp_file.txt
echo android { >> temp_file2.txt
echo     namespace 'com.oblador.vectoricons' >> temp_file2.txt
findstr /v "android {" temp_file.txt >> temp_file2.txt
move temp_file2.txt node_modules\react-native-vector-icons\android\build.gradle
del temp_file.txt temp_namespace.txt

echo.
echo Namespace fixes complete!
echo Now running the app...
npx react-native run-android

echo.
pause






