import java.io.*; import java.util.*; import com.google.gson.*;

{{USER_CODE}}
public class Main{public static void main(String[] args)throws Exception{Gson gson=new Gson();BufferedReader reader=new BufferedReader(new InputStreamReader(System.in));String line;while((line=reader.readLine())!=null){JsonElement input=JsonParser.parseString(line);System.out.println(gson.toJson(new Solution().solve(input.getAsJsonObject().get("lo").getAsInt(),input.getAsJsonObject().get("hi").getAsInt())));}}}
