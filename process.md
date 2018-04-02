
# Video Processing


#### Find Cropping Parameters:
`ffmpeg -ss 90 -i 1_intro.mp4 -vframes 10 -vf cropdetect -f null -`


#### Test Crop
`ffplay -vf crop=1920:864:0:108 1_intro.mp4`


#### Crop Files
```
for i in *.mp4;
	do name=`echo $i | cut -d'.' -f1`;
	echo $name;
	ffmpeg -i "$i" -vf crop=1920:864:0:108 -c:a copy "${name}_c.mp4";
done
```

#### Compress Files
```
for i in *.mp4;
	do name=`echo $i | cut -d'.' -f1`;
	echo $name;
	ffmpeg -i "$i" -vcodec libx264 -crf 25 "${name}_s.mp4";
done
```


#### Generate Thumbnails
```
for i in *.mp4;
	do name=`echo $i | cut -d'.' -f1`;
	echo $name;
	ffmpeg -i "$i" -ss 00:00:03 -t 1 -s 1920x864 -f mjpeg "${name}_thumb.jpg";
done
```