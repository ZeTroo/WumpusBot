result=1
while [ $result -ne 0 ];
do
    nodejs main.js
    result=$?
done