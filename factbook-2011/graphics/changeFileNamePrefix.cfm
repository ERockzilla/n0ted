<cfsetting 	showDebugOutput = "no" >
<cfset currPath = GetDirectoryFromPath(GetCurrentTemplatePath())>
<cfset folder = "">
<cfset temp = currPath & folder>

<cfdirectory directory="#temp#"  name="dirQuery" action="LIST" sort="name ASC" filter="afr_*">

<cfset dirsArray=arraynew(1)>

<cfset i=0>
<strong>dsfdass</strong>

<cfquery dbtype="query" name="dirsOnly" >
 	SELECT * from dirQuery</cfquery>
<cfloop query="dirQuery">
	<cfif LCase(type) IS "file" GT 0>
		<cfoutput>
			<table>
				<tr>
					<!---<td><input type="checkbox" value="no" name="keep"/></td>--->
					<td width="400"><strong>#name#</strong></td>
					<td width="400"><cfset nName2 = Replace(#name#,"afr_","af_","all")>#nName2#</td>
					<cffile action="rename" source="#temp##name#" destination="#temp##nName2#" attributes="normal">
					
					<!---<cffile action="rename" source="#name#" destination="#nName2#"  attributes="normal" >
					<td><a href = "graphics/#name#" /><img src="graphics/#name#" style="border:none;"></td></td>--->
				</tr>
			</table>
		</cfoutput>
	</cfif>
</cfloop>
