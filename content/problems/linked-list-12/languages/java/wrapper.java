import java.io.*; import java.util.*; import com.google.gson.*;

{{USER_CODE}}
public class Main{public static void main(String[] args)throws Exception{Gson gson=new GsonBuilder().serializeNulls().create();BufferedReader reader=new BufferedReader(new InputStreamReader(System.in));String line;while((line=reader.readLine())!=null){JsonElement input=JsonParser.parseString(line);System.out.println(gson.toJson(new Solution().solve(input.getAsJsonObject().get("capacity").getAsInt(),gson.fromJson(input.getAsJsonObject().get("commands"), String[].class),gson.fromJson(input.getAsJsonObject().get("keys"), int[].class),gson.fromJson(input.getAsJsonObject().get("values"), int[].class))));}}}
