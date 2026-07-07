#!/bin/bash

BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
NC='\033[0m'

namesilo_key=$NAMESILO_API_KEY
domains="corbettclark.com ski-tripper.com"

host_col_width=25
max_value_width=60
prefix_width=36

wrap_value() {
    local value="$1"
    local indent="$2"
    local first="$3"
    printf '%s' "$first"
    while [ ${#value} -gt 0 ]; do
        printf '%s\n' "${value:0:$max_value_width}"
        value="${value:$max_value_width}"
        if [ ${#value} -gt 0 ]; then
            printf '%s' "$indent"
        fi
    done
}

for domain in $domains
do
    echo -e "${BOLD}${CYAN}DNS records for $domain${NC}"

    response=$(curl -s "https://www.namesilo.com/api/dnsListRecords?version=1&type=json&key=$namesilo_key&domain=$domain")

    code=$(echo "$response" | jq -r '.reply.code')
    if [ "$code" != "300" ]; then
        detail=$(echo "$response" | jq -r '.reply.detail')
        echo -e "  ${YELLOW}Error: $detail${NC}"
        echo
        continue
    fi

    echo "$response" | jq -r '.reply.resource_record | sort_by([.type, .host, .distance]) | .[] | "\(.type)\t\(.host)\t\(.value)\t\(.distance)"' | \
    while IFS=$'\t' read -r type host value distance
    do
        if [ "$distance" != "0" ]; then
            priority=" ($distance)"
        else
            priority=""
        fi
        display_value="${value}${priority}"
        value_indent=$(printf '%*s' "$prefix_width" '')
        host_len=${#host}
        val_len=${#display_value}
        if [ $host_len -le $host_col_width ] && [ $val_len -le $max_value_width ]; then
            printf "  ${GREEN}%-7s${NC} %-${host_col_width}s %s%s\n" "$type" "$host" "$value" "$priority"
        elif [ $host_len -le $host_col_width ]; then
            printf "  ${GREEN}%-7s${NC} %-${host_col_width}s " "$type" "$host"
            wrap_value "$display_value" "$value_indent" ""
        else
            printf "  ${GREEN}%-7s${NC} %s\n" "$type" "$host"
            printf '%s' "$value_indent"
            wrap_value "$display_value" "$value_indent" ""
        fi
    done

    echo
done
